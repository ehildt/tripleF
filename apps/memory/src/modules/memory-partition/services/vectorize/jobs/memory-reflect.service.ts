import { Injectable, Logger } from '@nestjs/common';

import {
  taxonomyLabelEntries,
  type TaxonomyLabelEntry,
} from '../../../../memory-taxonomy/helpers/taxonomy-label-entries.helper.js';
import type { MemoryFrictionLane } from '../../../../persistence/services/memory-friction.repository.js';
import { MemoryFrictionRepository } from '../../../../persistence/services/memory-friction.repository.js';
import type { MemoryTaxonomyMaintenanceField } from '../../../../persistence/services/memory-taxonomy.repository.js';
import { MemoryTaxonomyRepository } from '../../../../persistence/services/memory-taxonomy.repository.js';
import { CONVICTION_TAG } from '../../../../qdrant/constants/conviction.constant.js';
import type { MemoryReflectJobData } from '../../../../qdrant/models/memory.model.js';
import { EncyclopediaRepository } from '../../../../qdrant/services/encyclopedia.repository.js';
import { MemoryRepository } from '../../../../qdrant/services/memory.repository.js';
import { MemoryEnqueueService } from '../../../../qdrant/services/memory-enqueue.service.js';
import { MemoryOverridesService } from '../../../../qdrant/services/memory-overrides.service.js';
import { FrictionAdjudicatorService } from '../../friction-adjudicator.service.js';

/** Hard cap on points screened per run (mirrors the consolidate sweep). */
const MAX_POINTS_PER_RUN = 500;

/** Per-run outcome tallies for the summary log. */
interface ReflectCounts {
  screened: number;
  frictions: number;
  resolved: number;
  deferred: number;
}

/**
 * Reflection job handler (vectorize queue): the per-scope quality review that
 * screens unreflected points for CONTRADICTIONS against their near-neighbor
 * candidates and records them as frictions. A friction is a state-machined
 * pair — open until resolved or dismissed — and when the model names a clear
 * winner, the loser is marked superseded (never deleted) and the friction
 * closes resolved. Points are marked `is_reflected` after screening, so a
 * crash mid-run resumes from the oldest unreflected point.
 *
 * Covers all three lanes: partition facts, cognition insights (episodes are
 * short-term and excluded), and encyclopedia chunks (content only — snippets are
 * never reflected). Consolidation stays partition-only; this job is the
 * single home for friction detection.
 *
 * Failure philosophy (matches the consolidate job): Qdrant/Postgres errors
 * propagate to BullMQ (retry); an unparseable verdict for a point is warn +
 * leave unreflected (self-heals on the next run, never burns retries on a
 * deterministic failure).
 */
@Injectable()
export class MemoryReflectService {
  private readonly logger = new Logger(MemoryReflectService.name);

  constructor(
    private readonly adjudicator: FrictionAdjudicatorService,
    private readonly frictions: MemoryFrictionRepository,
    private readonly memoryRepository: MemoryRepository,
    private readonly encyclopediaRepository: EncyclopediaRepository,
    private readonly memoryEnqueue: MemoryEnqueueService,
    private readonly overrides: MemoryOverridesService,
    private readonly taxonomy: MemoryTaxonomyRepository,
  ) {}

  async execute(data: MemoryReflectJobData): Promise<void> {
    const limit = Math.min(data.limit ?? 100, MAX_POINTS_PER_RUN);
    const counts: ReflectCounts = {
      screened: 0,
      frictions: 0,
      resolved: 0,
      deferred: 0,
    };

    if (data.lane === 'encyclopedia') {
      await this.reflectEncyclopedia(data, limit, counts);
    } else {
      await this.reflectMemory(data, limit, counts);
      if (data.lane === 'partition' && !data.dryRun && counts.screened > 0) {
        await this.autoTriggerConviction(data.scopeKey, data.model);
      }
    }

    this.logger.log(
      `memory-reflect ${data.lane}/${data.scopeKey}: screened ${counts.screened} — frictions ${counts.frictions} (${counts.resolved} resolved), deferred ${counts.deferred}${data.dryRun ? ' (dryRun)' : ''}`,
    );
  }

  /**
   * Auto-trigger the conviction-synthesis sweep over a partition after a
   * real reflection run — newly reflected facts are synthesizable, so the
   * conviction pass picks them up (and dual-writes convictions/bridges).
   * Gated by convictionAutoEnabled and only fired when the run actually
   * screened a point (an empty sweep has nothing new to synthesize); the
   * model falls back to the reflection model when no dedicated conviction
   * model is configured.
   */
  private async autoTriggerConviction(
    memoryPartition: string,
    fallbackModel: string,
  ): Promise<void> {
    if (!this.overrides.getConvictionAutoEnabled()) return;
    await this.memoryEnqueue.enqueueConvictionJob({
      memoryPartition,
      model: this.overrides.getConvictionModel() ?? fallbackModel,
      limit: this.overrides.getConvictionBatchLimit(),
      maxConvictionsPerCluster: this.overrides.getConvictionMaxPerCluster(),
    });
  }

  /** Partition + cognition lanes: unreflected points of one scope. */
  private async reflectMemory(
    data: MemoryReflectJobData,
    limit: number,
    counts: ReflectCounts,
  ): Promise<void> {
    const scope =
      data.lane === 'partition'
        ? { memoryPartition: data.scopeKey }
        : {
            memoryCognition: data.scopeKey,
            // The distinguishing tags: episodes share the 'cognition' tag, so
            // the cognition screen filters on tag identity — insights AND
            // convictions are screened, episodes never.
            tags: ['insight', CONVICTION_TAG],
          };
    const points = await this.memoryRepository.scrollUnreflected({
      ...scope,
      limit,
    });
    if (points.length === 0) {
      this.logger.debug(
        `memory-reflect ${data.lane}/${data.scopeKey}: nothing unreflected`,
      );
      return;
    }

    // Points superseded earlier in THIS run are skipped — the snapshot was
    // taken before their friction resolved, and re-screening a loser could
    // flip the winner and supersede both sides.
    const newlySuperseded = new Set<string>();

    for (const point of points) {
      if (newlySuperseded.has(point.id)) continue;
      await this.screenPoint(data, scope, point, counts, newlySuperseded);
    }

    // Per-node maintenance stamp — the taxonomy nodes under which screened
    // points sit get their lastReflectedAt refresh (never cognition: that
    // lane is path-routed, taxonomy-free).
    if (data.lane === 'partition' && !data.dryRun) {
      await this.stampTouched(
        'partition',
        data.scopeKey,
        points.flatMap((point) =>
          taxonomyLabelEntries({
            cluster: point.category,
            community: point.community,
            hub: point.subject,
          }),
        ),
        'lastReflectedAt',
      );
    }
  }

  /** One memory point's friction screen (the per-point body of reflectMemory). */
  private async screenPoint(
    data: MemoryReflectJobData,
    scope:
      { memoryPartition: string } | { memoryCognition: string; tags: string[] },
    point: {
      id: string;
      vector: number[];
      text: string;
      createdAt: string;
      subject?: string;
      category?: string;
      kind?: string;
      stability?: string;
    },
    counts: ReflectCounts,
    newlySuperseded: Set<string>,
  ): Promise<void> {
    const candidates = (
      await this.memoryRepository.queryNeighborFacts({
        ...scope,
        vector: point.vector,
        limit: data.maxCandidates ?? 5,
        scoreThreshold: data.scoreThreshold ?? 0.3,
      })
    ).filter((candidate) => candidate.id !== point.id);

    const verdict = await this.adjudicator.adjudicate(
      data.model,
      {
        id: point.id,
        text: point.text,
        createdAt: point.createdAt,
        subject: point.subject,
        category: point.category,
        kind: point.kind,
        stability: point.stability,
      },
      candidates.map((candidate) => ({
        id: candidate.id,
        text: candidate.text,
        createdAt: candidate.createdAt,
        subject: candidate.subject,
        category: candidate.category,
        kind: candidate.kind,
        stability: candidate.stability,
      })),
    );
    if (!verdict) {
      this.logger.warn(
        `memory-reflect ${data.lane}/${data.scopeKey}: verdict unparseable for "${point.text.slice(0, 80)}" — point left unreflected`,
      );
      counts.deferred++;
      return;
    }

    if (verdict.contradicts && verdict.conflictingId) {
      const loser = await this.applyFriction(
        data,
        data.lane,
        this.memoryRepository.collection,
        data.scopeKey,
        point.id,
        verdict.conflictingId,
        verdict.winnerId,
        verdict.reason,
      );
      counts.frictions++;
      if (loser) {
        newlySuperseded.add(loser);
        counts.resolved++;
      }
    }

    if (!data.dryRun) {
      await this.memoryRepository.setPayloadForPoints([point.id], {
        is_reflected: true,
      });
    }
    counts.screened++;
  }

  /** Encyclopedia lane: unreflected content chunks of the global scope. */
  private async reflectEncyclopedia(
    data: MemoryReflectJobData,
    limit: number,
    counts: ReflectCounts,
  ): Promise<void> {
    const chunks = await this.encyclopediaRepository.scrollUnreflected(limit);
    if (chunks.length === 0) {
      this.logger.debug(
        'memory-reflect encyclopedia/global: nothing unreflected',
      );
      return;
    }

    // Points superseded earlier in THIS run are skipped (see reflectMemory).
    const newlySuperseded = new Set<string>();

    for (const chunk of chunks) {
      if (newlySuperseded.has(chunk.id)) continue;
      const candidates = (
        await this.encyclopediaRepository.queryNeighborFacts(
          chunk.vector,
          data.maxCandidates ?? 5,
          data.scoreThreshold ?? 0.3,
        )
      ).filter((candidate) => candidate.id !== chunk.id);

      const verdict = await this.adjudicator.adjudicate(
        data.model,
        { id: chunk.id, text: chunk.content, createdAt: chunk.fetchedAt },
        candidates.map((candidate) => ({
          id: candidate.id,
          text: candidate.content,
          createdAt: candidate.fetchedAt,
        })),
      );
      if (!verdict) {
        this.logger.warn(
          `memory-reflect encyclopedia/global: verdict unparseable for "${chunk.content.slice(0, 80)}" — chunk left unreflected`,
        );
        counts.deferred++;
        continue;
      }

      if (verdict.contradicts && verdict.conflictingId) {
        const loser = await this.applyFriction(
          data,
          'encyclopedia',
          this.encyclopediaRepository.collection,
          'global',
          chunk.id,
          verdict.conflictingId,
          verdict.winnerId,
          verdict.reason,
        );
        counts.frictions++;
        if (loser) {
          newlySuperseded.add(loser);
          counts.resolved++;
        }
      }

      if (!data.dryRun) {
        await this.encyclopediaRepository.setPayloadForPoints([chunk.id], {
          is_reflected: true,
        });
      }
      counts.screened++;
    }

    if (!data.dryRun) {
      await this.stampTouched(
        'encyclopedia',
        'global',
        chunks.flatMap((chunk) =>
          taxonomyLabelEntries({
            cluster: chunk.category,
            community: chunk.community,
            hub: chunk.topic,
          }),
        ),
        'lastReflectedAt',
      );
    }
  }

  /**
   * Stamp the maintenance field on the taxonomy nodes under which the
   * screened points sit (warn-and-continue — stamps are observability,
   * never a failure domain of the sweep).
   */
  private async stampTouched(
    lane: 'partition' | 'encyclopedia',
    scopeKey: string,
    labels: TaxonomyLabelEntry[],
    field: MemoryTaxonomyMaintenanceField,
  ): Promise<void> {
    if (labels.length === 0) return;
    try {
      await this.taxonomy.touchMaintenanceForLabels(
        lane,
        scopeKey,
        labels,
        field,
        new Date(),
      );
    } catch (error) {
      this.logger.warn(
        `memory-reflect ${lane}/${scopeKey}: maintenance stamps skipped — ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Record one contradiction and apply its outcome. Returns the superseded
   * point id when the friction was resolved (a winner was named), undefined
   * when it stays open.
   */
  private async applyFriction(
    data: MemoryReflectJobData,
    lane: MemoryFrictionLane,
    collection: string,
    scopeKey: string,
    recordId: string,
    conflictingId: string,
    winnerId: string | undefined,
    reason: string | undefined,
  ): Promise<string | undefined> {
    const [source, target] = [recordId, conflictingId].sort();
    if (data.dryRun) {
      this.logger.log(
        `memory-reflect ${lane}/${scopeKey} [dryRun]: friction ${source} ↔ ${target}${winnerId ? ` (winner ${winnerId})` : ''}`,
      );
      return winnerId === recordId || winnerId === conflictingId
        ? winnerId === recordId
          ? conflictingId
          : recordId
        : undefined;
    }

    await this.frictions.upsertFrictions([
      {
        lane,
        collection,
        scopeKey,
        source,
        target,
        kind: 'contradiction',
        status: 'open',
        reason,
      },
    ]);
    await this.setPayload(lane, [recordId, conflictingId], {
      is_friction: true,
    });

    const winner = winnerId === recordId || winnerId === conflictingId;
    if (!winner) return undefined;

    const loser = winnerId === recordId ? conflictingId : recordId;
    // The loser is superseded — no longer "in friction" at all.
    await this.setPayload(lane, [loser], {
      superseded: true,
      superseded_by: winnerId,
      is_friction: false,
    });
    await this.frictions.resolveFrictionByPair(
      lane,
      collection,
      scopeKey,
      source,
      target,
      reason ?? '',
    );
    // The winner stays recallable — clear its flag only when no OTHER open
    // friction still involves it (a point can be party to several frictions).
    if ((await this.frictions.countOpenForPoint(winnerId)) === 0) {
      await this.setPayload(lane, [winnerId], { is_friction: false });
    }
    return loser;
  }

  /** Payload write routed to the lane's repository. */
  private async setPayload(
    lane: MemoryFrictionLane,
    ids: string[],
    payload: Record<string, unknown>,
  ): Promise<void> {
    if (lane === 'encyclopedia') {
      await this.encyclopediaRepository.setPayloadForPoints(ids, payload);
    } else {
      await this.memoryRepository.setPayloadForPoints(ids, payload);
    }
  }
}
