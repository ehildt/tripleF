import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  buildClusterSummaryPrompt,
  MEMORY_CLUSTER_INSTRUCTIONS,
} from '@triplef/agent/prompts';
import { MemoryClusterSummarySchema } from '@triplef/agent/schemas';
import { AiSdkService } from '@triplef/ai-sdk';
import { parseLlmJson } from '@triplef/helpers/parse-llm-json';

import { OllamaConfigService } from '../../../../ai-sdk/configs/ollama-config.service.js';
import { buildProviderOptions } from '../../../../ai-sdk/helpers/provider-options.helper.js';
import {
  MemoryClusterRepository,
  type MemoryClusterRow,
} from '../../../../persistence/services/memory-cluster.repository.js';
import { MemoryLinkRepository } from '../../../../persistence/services/memory-link.repository.js';
import {
  clampClusterMinMembers,
  CLUSTER_MEMBER_TEXT_LIMIT,
  CLUSTER_SUMMARY_LIMIT,
  CLUSTER_TITLE_LIMIT,
  type MemoryClusterLane,
} from '../../../constants/cluster.constant.js';
import { QDRANT_CONFIG } from '../../../constants/qdrant.constants.js';
import {
  type ClusterPoint,
  detectClusters,
} from '../../../helpers/detect-clusters.helper.js';
import type { MemoryClusterJobData } from '../../../models/memory.model.js';
import type { QdrantConfig } from '../../../models/qdrant-config.model.js';
import { EncyclopediaRepository } from '../../encyclopedia.repository.js';
import { MemoryRepository } from '../../memory.repository.js';

/**
 * Cluster-detection + summarization job handler (vectorize queue): the
 * graph-structure pass that clusters one scope's link graph (semantic +
 * topical + evidence edges) into clusters and summarizes each one into a
 * title + summary — the cluster "report" that lets retrieval answer
 * cross-cutting questions without reading every member.
 *
 * Every point ends up in exactly one cluster (no lone facts): connected
 * components of at least `minMembers` become structural clusters, and
 * singletons are absorbed into their nearest cluster by cosine similarity
 * (category grouping is the cold-scope fallback when there are no edges).
 *
 * Drift-aware re-summarization (MS GraphRAG's own lesson): the full scope is
 * recomputed each run, but a cluster whose membership fingerprint is
 * unchanged keeps its stored title/summary — only changed clusters hit
 * the LLM. The scope's rows are replaced atomically, so stale fingerprints
 * never linger.
 *
 * Failure philosophy (matches the other sweeps): Qdrant/Postgres errors
 * propagate to BullMQ (retry); an unparseable summary for a cluster falls
 * back to a category-derived title with an empty summary (the row still
 * exists, the next run re-summarizes it).
 */
@Injectable()
export class MemoryClusterJobService {
  private readonly logger = new Logger(MemoryClusterJobService.name);

  constructor(
    private readonly aiSdkService: AiSdkService,
    private readonly ollamaConfigService: OllamaConfigService,
    private readonly memoryRepository: MemoryRepository,
    private readonly encyclopediaRepository: EncyclopediaRepository,
    private readonly links: MemoryLinkRepository,
    private readonly clusters: MemoryClusterRepository,
    @Inject(QDRANT_CONFIG) private readonly config: QdrantConfig,
  ) {}

  async execute(data: MemoryClusterJobData): Promise<void> {
    const minMembers = clampClusterMinMembers(data.minMembers ?? 2);
    const collection = this.collectionFor(data.lane);
    const scopeSeed = `${data.lane}|${collection}|${data.scopeKey}`;

    const edges = await this.links.listAllEdges(
      data.lane,
      collection,
      data.scopeKey,
    );
    const points = await this.scrollPoints(data.lane, data.scopeKey);
    if (points.length === 0) {
      this.logger.debug(
        `memory-cluster ${data.lane}/${data.scopeKey}: no points`,
      );
      return;
    }

    const detection = detectClusters({
      edges,
      points,
      minMembers,
      scopeSeed,
    });

    if (data.dryRun) {
      this.logger.log(
        `memory-cluster ${data.lane}/${data.scopeKey} [dryRun]: ${detection.clusters.length} clusters from ${points.length} points`,
      );
      return;
    }

    const pointById = new Map(points.map((point) => [point.id, point]));
    const existing = await this.clusters.listByScope(
      data.lane,
      collection,
      data.scopeKey,
    );
    const existingByFingerprint = new Map(
      existing.map((cluster) => [cluster.fingerprint, cluster]),
    );

    const rows: MemoryClusterRow[] = [];
    let summarized = 0;
    for (const cluster of detection.clusters) {
      const prior = existingByFingerprint.get(cluster.fingerprint);
      if (prior) {
        rows.push({
          id: cluster.id,
          lane: data.lane,
          collection,
          scopeKey: data.scopeKey,
          fingerprint: cluster.fingerprint,
          title: prior.title,
          summary: prior.summary,
          memberCount: cluster.memberCount,
          memberIds: cluster.memberIds,
        });
        continue;
      }
      const members = cluster.memberIds
        .map((id) => pointById.get(id))
        .filter((point): point is ClusterPoint => point !== undefined);
      const summary = await this.summarize(data.model, members);
      rows.push({
        id: cluster.id,
        lane: data.lane,
        collection,
        scopeKey: data.scopeKey,
        fingerprint: cluster.fingerprint,
        title: summary?.title ?? fallbackTitle(members),
        summary: summary?.summary ?? '',
        memberCount: cluster.memberCount,
        memberIds: cluster.memberIds,
      });
      summarized++;
    }

    await this.clusters.replaceScope(
      data.lane,
      collection,
      data.scopeKey,
      rows,
    );
    await this.setClusterIds(data.lane, detection.assignments);

    this.logger.log(
      `memory-cluster ${data.lane}/${data.scopeKey}: ${rows.length} clusters (${summarized} summarized) from ${points.length} points`,
    );
  }

  /** One LLM summary call; undefined when the answer is unusable. */
  private async summarize(
    model: string,
    members: ClusterPoint[],
  ): Promise<{ title: string; summary: string } | undefined> {
    const capped = members.slice(0, CLUSTER_MEMBER_TEXT_LIMIT);
    const { text } = await this.aiSdkService.generateChat({
      model,
      messages: [
        { role: 'system', content: MEMORY_CLUSTER_INSTRUCTIONS },
        {
          role: 'user',
          content: buildClusterSummaryPrompt({
            category: modalCategory(members),
            members: capped.map((member) => ({ text: member.text })),
          }),
        },
      ],
      providerOptions: buildProviderOptions({
        think: false,
        keepAlive: this.ollamaConfigService.config.keepAlive,
      }),
      tools: {},
    });
    if (!text?.trim()) return undefined;
    try {
      const parsed = MemoryClusterSummarySchema.safeParse(parseLlmJson(text));
      if (!parsed.success) return undefined;
      return {
        title: parsed.data.title.trim().slice(0, CLUSTER_TITLE_LIMIT),
        summary: parsed.data.summary.trim().slice(0, CLUSTER_SUMMARY_LIMIT),
      };
    } catch {
      return undefined;
    }
  }

  private async scrollPoints(
    lane: MemoryClusterLane,
    scopeKey: string,
  ): Promise<ClusterPoint[]> {
    if (lane === 'partition') {
      return this.memoryRepository.scrollScopePoints(
        scopeKey,
        this.config.constellationNodeLimit,
      );
    }
    return this.encyclopediaRepository.scrollScopePoints(
      this.config.constellationNodeLimit,
    );
  }

  private async setClusterIds(
    lane: MemoryClusterLane,
    assignments: Map<string, string>,
  ): Promise<void> {
    if (lane === 'partition') {
      await this.memoryRepository.setClusterIds(assignments);
    } else {
      await this.encyclopediaRepository.setClusterIds(assignments);
    }
  }

  private collectionFor(lane: MemoryClusterLane): string {
    return lane === 'partition'
      ? this.memoryRepository.collection
      : this.encyclopediaRepository.collection;
  }
}

/** Most common category among members — the summary prompt's naming hint. */
function modalCategory(members: ClusterPoint[]): string | undefined {
  const counts = new Map<string, number>();
  for (const member of members) {
    const category = member.category?.trim();
    if (!category) continue;
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }
  let best: string | undefined;
  let bestCount = 0;
  for (const [category, count] of counts) {
    if (count > bestCount) {
      best = category;
      bestCount = count;
    }
  }
  return best;
}

/** Fallback title when the summary verdict is unparseable. */
function fallbackTitle(members: ClusterPoint[]): string {
  const category = modalCategory(members);
  if (category) return category;
  const first = members.find((member) => member.text.trim())?.text.trim();
  return first ? first.slice(0, CLUSTER_TITLE_LIMIT) : 'untitled';
}
