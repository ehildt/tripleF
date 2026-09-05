import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  buildClusterSummaryPrompt,
  MEMORY_CLUSTER_INSTRUCTIONS,
} from '@triplef/agent/prompts';
import { MemoryClusterSummarySchema } from '@triplef/agent/schemas';
import { AiSdkService } from '@triplef/ai-sdk';
import { parseLlmJson } from '@triplef/helpers/parse-llm-json';

import { OllamaConfigService } from '../../../../ollama/configs/ollama-config.service.js';
import { buildProviderOptions } from '../../../../ollama/helpers/provider-options.helper.js';
import {
  type MemoryClusterRecord,
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
} from '../../../../qdrant/constants/cluster.constant.js';
import { QDRANT_CONFIG } from '../../../../qdrant/constants/qdrant.constants.js';
import { deterministicPointId } from '../../../../qdrant/helpers/deterministic-point-id.helper.js';
import type { MemoryClusterJobData } from '../../../../qdrant/models/memory.model.js';
import type { QdrantConfig } from '../../../../qdrant/models/qdrant-config.model.js';
import { EmbeddingService } from '../../../../qdrant/services/embedding.service.js';
import { EncyclopediaRepository } from '../../../../qdrant/services/encyclopedia.repository.js';
import { MemoryRepository } from '../../../../qdrant/services/memory.repository.js';
import { MemoryOverridesService } from '../../../../qdrant/services/memory-overrides.service.js';
import {
  type SynopsisPoint,
  SynopsisRepository,
  synopsisText,
} from '../../../../qdrant/services/synopsis.repository.js';
import {
  type ClusterPoint,
  cosineSimilarity,
  detectClusters,
} from '../../../helpers/detect-clusters.helper.js';

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
    private readonly synopses: SynopsisRepository,
    private readonly embeddingService: EmbeddingService,
    private readonly overrides: MemoryOverridesService,
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
    // Fingerprint reuse is keyed by level too — a level-0 cluster (members =
    // point ids) and an upper synopsis cluster (members = cluster ids) must
    // never trade fingerprints.
    const existingByFingerprint = new Map(
      existing.map((cluster) => [
        `${cluster.level}|${cluster.fingerprint}`,
        cluster,
      ]),
    );

    // Level 0: clusters over the scope's points (members = point ids).
    const leafRows: MemoryClusterRow[] = [];
    let summarized = 0;
    for (const cluster of detection.clusters) {
      const prior = existingByFingerprint.get(`0|${cluster.fingerprint}`);
      if (prior) {
        leafRows.push({
          id: cluster.id,
          lane: data.lane,
          collection,
          scopeKey: data.scopeKey,
          fingerprint: cluster.fingerprint,
          title: prior.title,
          summary: prior.summary,
          memberCount: cluster.memberCount,
          memberIds: cluster.memberIds,
          level: 0,
        });
        continue;
      }
      const members = cluster.memberIds
        .map((id) => pointById.get(id))
        .filter((point): point is ClusterPoint => point !== undefined);
      const summary = await this.summarize(data.model, members);
      leafRows.push({
        id: cluster.id,
        lane: data.lane,
        collection,
        scopeKey: data.scopeKey,
        fingerprint: cluster.fingerprint,
        title: summary?.title ?? fallbackTitle(members),
        summary: summary?.summary ?? '',
        memberCount: cluster.memberCount,
        memberIds: cluster.memberIds,
        level: 0,
      });
      summarized++;
    }

    // Raptor: synopsis hierarchy above the leaf clusters (members = child
    // cluster ids). Off → leaf rows only, and every synopsis point of the
    // scope is purged below.
    const raptorEnabled = this.overrides.getRaptorEnabled();
    const upperRows = raptorEnabled
      ? await this.buildSynopsisLevels({
          lane: data.lane,
          collection,
          scopeKey: data.scopeKey,
          scopeSeed,
          model: data.model,
          minMembers,
          baseRows: leafRows,
          existingByFingerprint,
        })
      : [];
    const rows = [...leafRows, ...upperRows];

    await this.clusters.replaceScope(
      data.lane,
      collection,
      data.scopeKey,
      rows,
    );
    await this.setClusterIds(data.lane, detection.assignments);
    await this.syncSynopsisLifecycle(data.lane, data.scopeKey, rows);

    this.logger.log(
      `memory-cluster ${data.lane}/${data.scopeKey}: ${rows.length} clusters (${summarized} summarized) from ${points.length} points`,
    );
  }

  /**
   * The Raptor recursion: embed each level's cluster synopses as points
   * (`title + summary`), link the pairs that clear the semantic threshold,
   * cluster them one level up, summarize, repeat — until fewer than two
   * clusters remain, no edges form, or the depth cap hits (default 3).
   *
   * Deterministic like the leaf pass: upper cluster ids hash scopeSeed+level
   * plus the sorted CHILD cluster ids, and unchanged fingerprints keep their
   * stored title/summary — an unchanged scope stays a zero-LLM re-run.
   */
  private async buildSynopsisLevels(params: {
    lane: MemoryClusterLane;
    collection: string;
    scopeKey: string;
    scopeSeed: string;
    model: string;
    minMembers: number;
    baseRows: MemoryClusterRow[];
    existingByFingerprint: Map<string, MemoryClusterRecord>;
  }): Promise<MemoryClusterRow[]> {
    const maxDepth = this.overrides.getRaptorMaxDepth();
    const rows: MemoryClusterRow[] = [];
    let lower = params.baseRows;
    for (let depth = 1; depth <= maxDepth; depth++) {
      if (lower.length < 2) break;
      const vectors = await this.syncLevelSynopses(
        params.lane,
        params.scopeKey,
        lower,
      );
      const synopsisPoints: ClusterPoint[] = lower.flatMap((row) => {
        const vector = vectors.get(row.id);
        return vector
          ? [
              {
                id: row.id,
                vector,
                text: synopsisText(row.title, row.summary),
                tags: [],
              },
            ]
          : [];
      });
      if (synopsisPoints.length < 2) break;
      const edges = this.pairwiseEdges(
        synopsisPoints,
        this.config.linkScoreThreshold,
      );
      const detection = detectClusters({
        edges,
        points: synopsisPoints,
        minMembers: params.minMembers,
        scopeSeed: `${params.scopeSeed}|L${depth}`,
        allowCategoryFallback: false,
      });
      if (detection.clusters.length === 0) break;

      const rowById = new Map(lower.map((row) => [row.id, row]));
      const levelRows: MemoryClusterRow[] = [];
      for (const cluster of detection.clusters) {
        levelRows.push(
          await this.buildUpperClusterRow({
            lane: params.lane,
            collection: params.collection,
            scopeKey: params.scopeKey,
            model: params.model,
            depth,
            cluster,
            members: cluster.memberIds
              .map((id) => rowById.get(id))
              .filter((row): row is MemoryClusterRow => row !== undefined),
            existingByFingerprint: params.existingByFingerprint,
          }),
        );
      }
      // Parent links point UP: each lower-level cluster gains this level's
      // cluster id as its parentId (children are already in `rows`/leafRows).
      for (const [childId, parentId] of detection.assignments) {
        const child = rowById.get(childId);
        if (child) child.parentId = parentId;
      }
      rows.push(...levelRows);
      lower = levelRows;
    }
    return rows;
  }

  /**
   * One upper-level cluster row: fingerprint-stable clusters keep their
   * stored title/summary; otherwise the LLM summarizes the member synopses
   * (cluster-of-summaries text) with the largest child's title as fallback.
   */
  private async buildUpperClusterRow(params: {
    lane: MemoryClusterLane;
    collection: string;
    scopeKey: string;
    model: string;
    depth: number;
    cluster: {
      id: string;
      fingerprint: string;
      memberIds: string[];
      memberCount: number;
    };
    members: MemoryClusterRow[];
    existingByFingerprint: Map<string, MemoryClusterRecord>;
  }): Promise<MemoryClusterRow> {
    const prior = existingFingerprintOf(
      params.existingByFingerprint,
      params.depth,
      params.cluster.fingerprint,
    );
    let title = prior?.title;
    let summary = prior?.summary;
    if (!prior) {
      const verdict = await this.summarize(
        params.model,
        params.members.map((member) => ({
          id: member.id,
          vector: [],
          text: synopsisText(member.title, member.summary),
          tags: [],
        })),
      );
      title = verdict?.title ?? fallbackTitleOfClusters(params.members);
      summary = verdict?.summary ?? '';
    }
    return {
      id: params.cluster.id,
      lane: params.lane,
      collection: params.collection,
      scopeKey: params.scopeKey,
      fingerprint: params.cluster.fingerprint,
      title,
      summary,
      memberCount: params.cluster.memberCount,
      memberIds: params.cluster.memberIds,
      level: params.depth,
    };
  }

  /**
   * Embed + upsert one level's synopses, reusing stored vectors for
   * fingerprint-stable clusters (identical cluster id ⇒ identical text ⇒
   * identical vector — the drift-aware contract). Returns row id → vector.
   */
  private async syncLevelSynopses(
    lane: MemoryClusterLane,
    scopeKey: string,
    rows: MemoryClusterRow[],
  ): Promise<Map<string, number[]>> {
    const level = rows[0]?.level ?? 0;
    const existing = await this.synopses.scrollSynopses(lane, scopeKey, level);
    const existingByClusterId = new Map(
      existing.map((point) => [point.clusterId, point]),
    );
    const missing = rows.filter((row) => !existingByClusterId.has(row.id));
    const vectors = missing.length
      ? await this.embeddingService.embed(
          missing.map((row) => synopsisText(row.title, row.summary)),
          'document',
        )
      : [];
    const vectorByRowId = new Map<string, number[]>();
    const points: SynopsisPoint[] = [];
    missing.forEach((row, index) => {
      const vector = vectors[index];
      if (!vector) return;
      vectorByRowId.set(row.id, vector);
      points.push({
        id: synopsisPointId(row.id),
        clusterId: row.id,
        scopeKey,
        level: row.level,
        title: row.title,
        summary: row.summary,
        memberCount: row.memberCount,
        vector,
      });
    });
    for (const row of rows) {
      const reused = existingByClusterId.get(row.id);
      if (reused) vectorByRowId.set(row.id, reused.vector);
    }
    await this.synopses.upsertSynopses(lane, points);
    return vectorByRowId;
  }

  /**
   * The synopsis lifecycle after replaceScope: leaf synopses exist even when
   * the recursion stopped at one level (they are the probe-visible layer),
   * and stale synopsis points whose cluster left the row set are deleted.
   * With Raptor off, the scope's synopsis layer is purged entirely.
   */
  private async syncSynopsisLifecycle(
    lane: MemoryClusterLane,
    scopeKey: string,
    rows: MemoryClusterRow[],
  ): Promise<void> {
    if (!this.overrides.getRaptorEnabled()) {
      await this.synopses.deleteSynopsesNotIn(lane, scopeKey, new Set());
      return;
    }
    const leafRows = rows.filter((row) => row.level === 0);
    await this.syncLevelSynopses(lane, scopeKey, leafRows);
    await this.synopses.deleteSynopsesNotIn(
      lane,
      scopeKey,
      new Set(rows.map((row) => row.id)),
    );
  }

  /**
   * Every synopsis pair above the semantic threshold becomes an edge — the
   * upper-level link graph. Cluster counts per level are small, so all-pairs
   * cosine is cheap and needs no relink machinery.
   */
  private pairwiseEdges(
    points: ClusterPoint[],
    threshold: number,
  ): Array<{ source: string; target: string }> {
    const edges: Array<{ source: string; target: string }> = [];
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        if (cosineSimilarity(points[i].vector, points[j].vector) >= threshold) {
          edges.push({ source: points[i].id, target: points[j].id });
        }
      }
    }
    return edges;
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

/**
 * Deterministic synopsis-point id for a cluster (`synopsis|<clusterId>`,
 * hashed to a UUID — Qdrant accepts ints/UUIDs only) — identical cluster
 * identity ⇒ identical point id ⇒ overwrite-in-place.
 */
function synopsisPointId(clusterId: string): string {
  return deterministicPointId(`synopsis|${clusterId}`);
}

/** Fingerprint reuse lookup (`<level>|<fingerprint>` — levels never trade). */
function existingFingerprintOf(
  existingByFingerprint: Map<string, MemoryClusterRecord>,
  level: number,
  fingerprint: string,
): MemoryClusterRecord | undefined {
  return existingByFingerprint.get(`${level}|${fingerprint}`);
}

/**
 * Fallback title for an upper-level (synopsis) cluster when the summary
 * verdict is unparseable: the largest child cluster's title.
 */
function fallbackTitleOfClusters(members: MemoryClusterRow[]): string {
  const largest = [...members].sort((a, b) => b.memberCount - a.memberCount)[0];
  return (largest?.title.trim() ?? 'untitled').slice(0, CLUSTER_TITLE_LIMIT);
}
