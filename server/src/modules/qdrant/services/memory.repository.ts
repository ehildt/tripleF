import { Inject, Injectable } from '@nestjs/common';

import { QDRANT_CONFIG } from '../constants/qdrant.constants.js';
import { buildMemoryMust } from '../helpers/build-memory-filters.helper.js';
import type {
  ListMemoryInput,
  MemoryPoint,
  SearchMemoryInput,
  UpsertBatchInput,
} from '../models/memory.model.js';
import type { QdrantConfig } from '../models/qdrant-config.model.js';

import { QdrantClientService } from './qdrant-client.service.js';

/**
 * The only layer that talks Qdrant payloads. Every point belongs to exactly
 * one space, identified by its key: `memory_partition` (the user's fact
 * space — by default the caller's session id, or a user-set partition id from
 * sysctl that survives browser-session rotation) or `memory_cognition` (the
 * AI's living understanding-of-the-user document). The agentic tools always
 * scope reads to the turn's space key; the public endpoints may tighten
 * further (session/conversation/request/role/tags/contains/exact text).
 *
 * One point = one memory record (an extracted fact, an explicitly remembered
 * statement, or the cognition document) whose payload text IS the record.
 * There is no chunk layer: the conversation transcript already lives in the
 * harness history.
 */
@Injectable()
export class MemoryRepository {
  constructor(
    private readonly clientService: QdrantClientService,
    @Inject(QDRANT_CONFIG) private readonly config: QdrantConfig,
  ) {}

  private get collection(): string {
    return this.clientService.collection;
  }

  /**
   * Batch upsert of one turn-side's records: one point per record with a
   * deterministic id, so the same record restated later overwrites in place.
   * `memory_partition` / `memory_cognition` is the identity key (exactly one
   * is set); session/conversation/request are provenance for later filtering.
   */
  async upsertBatch(input: UpsertBatchInput): Promise<void> {
    // Collection missing (feature off or Qdrant wiped) ⇒ drop silently: the
    // vectorize pipeline is fire-and-forget and the harness must proceed.
    if (!(await this.clientService.hasCollection())) return;
    const client = this.clientService.getClient();
    const createdAt = new Date().toISOString();
    await client.upsert(this.collection, {
      wait: true,
      points: input.points.map((point) => ({
        id: point.id,
        vector: point.vector,
        payload: {
          memory_partition: input.memoryPartition,
          memory_cognition: input.memoryCognition,
          session_id: input.sessionId,
          role: input.role,
          conversation_id: input.conversationId,
          request_id: input.requestId,
          text: point.text,
          tags: point.tags ?? [],
          path: point.path,
          created_at: createdAt,
        },
      })),
    });
  }

  /**
   * Semantic search with optional space scope: `memory_partition`/
   * `memory_cognition` (the identity key) narrows to one caller's memory;
   * every other field (session / role / conversation / request / tags /
   * contains / exact text) is an optional tightening on top.
   */
  async searchMemory(input: SearchMemoryInput): Promise<MemoryPoint[]> {
    if (!(await this.clientService.hasCollection())) return [];
    const client = this.clientService.getClient();
    const result = await client.query(this.collection, {
      query: input.vector,
      limit: Math.min(input.limit ?? 5, 5),
      score_threshold: this.config.scoreThreshold,
      with_payload: true,
      filter: { must: buildMemoryMust(input) },
    });
    return result.points.map((point) => this.toMemoryPoint(point));
  }

  /** Scroll-based listing for the sysctl inspection surface (no vector needed). */
  async listMemory(input: ListMemoryInput): Promise<MemoryPoint[]> {
    if (!(await this.clientService.hasCollection())) return [];
    const client = this.clientService.getClient();
    const result = await client.scroll(this.collection, {
      filter: { must: buildMemoryMust(input) },
      limit: Math.min(input.limit ?? 100, 100),
      with_payload: true,
      with_vector: false,
    });
    return result.points.map((point) => this.toMemoryPoint(point));
  }

  /** Remove every fact record of one conversation within a partition (cleanup / undo). Cognition transcends conversations and survives. */
  async deleteByConversation(input: {
    memoryPartition: string;
    conversationId: string;
  }): Promise<number> {
    return this.deleteByFilter({
      must: buildMemoryMust(input),
    });
  }

  /**
   * Sysctl prune: drop ALL fact records of a space key (the user's memory
   * partition). The cognition lane has its own wipe (deleteCognition) —
   * lanes stay cleanly separable, so a partition prune never touches the
   * AI's understanding of the user.
   */
  async deletePartitionData(partition: string): Promise<number> {
    return this.deleteByFilter({
      must: [{ key: 'memory_partition', match: { value: partition } }],
    });
  }

  /** Point-id deletion for the filtered delete path (records resolved first, then removed by id). */
  async deleteByIds(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    if (!(await this.clientService.hasCollection())) return;
    await this.clientService.getClient().delete(this.collection, {
      points: ids,
      wait: true,
    });
  }

  private async deleteByFilter(filter: {
    must?: Array<Record<string, unknown>>;
    should?: Array<Record<string, unknown>>;
  }): Promise<number> {
    if (!(await this.clientService.hasCollection())) return 0;
    const client = this.clientService.getClient();
    const { count } = await client.count(this.collection, {
      filter,
      exact: true,
    });
    if (count === 0) return 0;
    await client.delete(this.collection, { filter, wait: true });
    return count;
  }

  private toMemoryPoint(point: {
    id: unknown;
    score?: number;
    payload?: Record<string, unknown> | null;
  }): MemoryPoint {
    const payload = point.payload ?? {};
    return {
      id: String(point.id),
      memoryPartition: payload.memory_partition as string | undefined,
      memoryCognition: payload.memory_cognition as string | undefined,
      sessionId: payload.session_id as string | undefined,
      role: payload.role as MemoryPoint['role'],
      conversationId: payload.conversation_id as string | undefined,
      requestId: payload.request_id as string | undefined,
      text: (payload.text as string) ?? '',
      tags: Array.isArray(payload.tags) ? (payload.tags as string[]) : [],
      path: payload.path as string | undefined,
      createdAt: payload.created_at as string,
      score: point.score,
    };
  }
}
