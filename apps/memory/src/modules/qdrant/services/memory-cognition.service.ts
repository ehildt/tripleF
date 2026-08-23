import { Inject, Injectable } from '@nestjs/common';

import { MemoryCognitionProfileRepository } from '../../persistence/services/memory-cognition-profile.repository.js';
import { QDRANT_CONFIG } from '../constants/qdrant.constants.js';
import { deterministicPointId } from '../helpers/deterministic-point-id.helper.js';
import type { MemoryPoint } from '../models/memory.model.js';
import {
  COGNITION_PURGE_BATCH,
  INSIGHT_TAGS,
  INSIGHT_TEXT_LIMIT,
  INSIGHTS_MAX_PER_TURN,
  type MemoryCognitionProfile,
  type MemoryProfileInsight,
  normalizeInsightPath,
  parseStoredProfile,
} from '../models/memory-cognition.model.js';
import type { QdrantConfig } from '../models/qdrant-config.model.js';

import { EmbeddingService } from './embedding.service.js';
import { MemoryRepository } from './memory.repository.js';

interface CognitionScope {
  memoryCognition: string;
  sessionId?: string;
  conversationId?: string;
  /** Harness turn id — traces every cognition write back to the user request. */
  requestId?: string;
}

/**
 * The AI's cognition lane (`memory_cognition` space): the assistant's
 * accumulated understanding of the user in two forms — ONE structured profile
 * document (stable traits, preferences, goals; always-on respond context)
 * and any number of derived insight records (topic-specific understanding,
 * probed by embedding at respond time). Both live next to (never inside) the
 * user's fact partition and share the `cognition` tag family.
 *
 * The profile document is the routing map and lives in Postgres (one row per
 * space, merged in code, atomically upserted); the insights are the depth
 * behind its topics and live in Qdrant (deterministic ids, `path` payload
 * pointing back into the profile, embedded for the respond-time probe).
 * Insights dedupe by text (deterministic id), so repeats are no-op
 * overwrites. Disclosure is a plain read — the user can always ask what the
 * AI thinks of them and get this space quoted.
 */
@Injectable()
export class MemoryCognitionService {
  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly memoryRepository: MemoryRepository,
    private readonly profileRepository: MemoryCognitionProfileRepository,
    @Inject(QDRANT_CONFIG) private readonly config: QdrantConfig,
  ) {}

  /**
   * The current structured profile document for a cognition space, when one
   * exists. Postgres is the source of truth; on a miss the legacy Qdrant
   * profile point (pre-migration deployments) is read, backfilled into
   * Postgres and dropped — self-healing, no data loss, no migration script.
   */
  async getProfile(
    memoryCognition: string,
  ): Promise<MemoryCognitionProfile | undefined> {
    const row = await this.profileRepository.findBySpace(memoryCognition);
    if (row) return row.profile as MemoryCognitionProfile;
    return this.migrateLegacyProfile(memoryCognition);
  }

  /** True when the space holds at least one probed insight — the cheap gate that keeps the respond-time probe off cold spaces (no embed round-trip until cognition exists). */
  async hasInsights(memoryCognition: string): Promise<boolean> {
    const [first] = await this.memoryRepository.listMemory({
      memoryCognition,
      tags: [...INSIGHT_TAGS],
      limit: 1,
    });
    return first !== undefined;
  }

  /** The derived insight records of a cognition space (newest first is not guaranteed — this is the management/listing read). */
  async listInsights(
    memoryCognition: string,
    limit = 100,
  ): Promise<MemoryPoint[]> {
    return this.memoryRepository.listMemory({
      memoryCognition,
      tags: [...INSIGHT_TAGS],
      limit,
    });
  }

  /**
   * Persist the space's structured profile — one atomic Postgres row upsert
   * (create or update), never a whole-document replace from a model verdict.
   * Callers hand this the MERGED document — patches are resolved in code
   * (mergeCognitionProfiles), never at the storage layer. Serialized size is
   * capped by the caller-provided limit (the memoryCognitionLimit system
   * variable); over-cap writes throw so the caller keeps the old document.
   * No embedding: the profile is always-on routing context, never probed —
   * the old Qdrant profile vector was dead weight and its embed round-trip a
   * write-failure mode. Throws when the feature is off — callers catch.
   */
  async storeProfile(
    scope: CognitionScope,
    profile: MemoryCognitionProfile,
    limit: number,
  ): Promise<string> {
    if (!this.config.enabled) {
      throw new Error('Memory feature is disabled');
    }
    const text = JSON.stringify(profile);
    if (text.length > limit) {
      throw new Error(
        `Cognition profile exceeds the ${limit}-character cap — the memoryCognitionLimit system variable is the valve`,
      );
    }
    await this.profileRepository.upsert(
      scope.memoryCognition,
      profile as Record<string, unknown>,
      {
        sessionId: scope.sessionId,
        conversationId: scope.conversationId,
        requestId: scope.requestId,
      },
    );
    return scope.memoryCognition;
  }

  /**
   * Store newly derived insight records (one Qdrant point per insight, id
   * seeded on the text itself so repeats overwrite silently). `path` pins
   * the insight to the profile facet it deepens (`likes.cars`) for the
   * respond-time probe's query shaping; paths are normalized to the
   * canonical probe format (lowercase, dash-joined segments — see
   * normalizeInsightPath), so repeats also self-heal previously
   * mis-formatted paths. Returns how many were written. Throws when the
   * feature is off or the embed fails — callers catch.
   */
  async upsertInsights(
    scope: CognitionScope,
    insights: MemoryProfileInsight[],
  ): Promise<number> {
    if (!this.config.enabled) {
      throw new Error('Memory feature is disabled');
    }
    const items = insights
      .map((insight) => ({
        text: insight.text.trim().slice(0, INSIGHT_TEXT_LIMIT),
        path: normalizeInsightPath(insight.path),
      }))
      .filter((insight) => insight.text.length > 0)
      .slice(0, INSIGHTS_MAX_PER_TURN);
    if (items.length === 0) return 0;

    const vectors = await this.embeddingService.embed(
      items.map((i) => i.text),
      'document',
    );
    if (vectors.length !== items.length) {
      throw new Error('Embedding returned fewer vectors than insights');
    }

    const points = items.map((item, index) => ({
      id: deterministicPointId(
        `${scope.memoryCognition}|cognition|insight|${item.text}`,
      ),
      vector: vectors[index],
      text: item.text,
      tags: [...INSIGHT_TAGS],
      path: item.path,
    }));
    await this.memoryRepository.upsertBatch({
      memoryCognition: scope.memoryCognition,
      role: 'assistant',
      sessionId: scope.sessionId,
      conversationId: scope.conversationId,
      requestId: scope.requestId,
      points,
    });
    return points.length;
  }

  /**
   * Forget the AI's understanding of the user — purges the WHOLE cognition
   * space: the Postgres profile row plus every Qdrant point (insights and
   * any legacy profile point). Returns the removed texts for transparent
   * confirmation; empty when the space held nothing.
   */
  async deleteCognition(memoryCognition: string): Promise<string[]> {
    const removed: string[] = [];
    // Batch loop: spaces can outgrow one listing page once insights accrue.
    for (;;) {
      const batch = await this.memoryRepository.listMemory({
        memoryCognition,
        limit: COGNITION_PURGE_BATCH,
      });
      if (batch.length === 0) break;
      await this.memoryRepository.deleteByIds(batch.map((point) => point.id));
      removed.push(...batch.map((point) => point.text));
    }
    await this.profileRepository.deleteBySpace(memoryCognition);
    return removed;
  }

  /**
   * Legacy migration: the profile used to live as a Qdrant point tagged
   * `cognition/profile` (whole-document replace, deterministic id). Read it,
   * backfill the Postgres row, drop the Qdrant point — one visit, then the
   * row is the single source of truth. Returns the parsed document (or
   * undefined when the space never had one).
   */
  private async migrateLegacyProfile(
    memoryCognition: string,
  ): Promise<MemoryCognitionProfile | undefined> {
    // Filter on the 'profile' tag ALONE: the legacy profile point is the
    // only point carrying it (insight points are ['cognition','insight']),
    // while any-matching the full cognition tag set could land on an insight
    // point first in scroll order and misfire the migration.
    const [legacy] = await this.memoryRepository.listMemory({
      memoryCognition,
      tags: ['profile'],
      limit: 1,
    });
    if (!legacy) return undefined;
    const profile = parseStoredProfile(legacy.text);
    if (profile && Object.keys(profile).length > 0) {
      await this.profileRepository.upsert(memoryCognition, profile, {
        sessionId: legacy.sessionId,
        conversationId: legacy.conversationId,
        requestId: legacy.requestId,
      });
    }
    // Either way the legacy point is consumed — the row is authoritative
    // from here on (an empty stored point is meaningless either way).
    await this.memoryRepository.deleteByIds([legacy.id]);
    return profile && Object.keys(profile).length > 0 ? profile : undefined;
  }
}
