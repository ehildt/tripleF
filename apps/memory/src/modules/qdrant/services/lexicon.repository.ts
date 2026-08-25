import { Inject, Injectable, Logger } from '@nestjs/common';

import {
  type MemoryLinkEdge,
  MemoryLinkRepository,
  type MemoryLinkRow,
} from '../../persistence/services/memory-link.repository.js';
import { QDRANT_CONFIG } from '../constants/qdrant.constants.js';
import type {
  LexiconChunkHit,
  LexiconChunkPoint,
} from '../models/lexicon-chunk.model.js';
import type { QdrantConfig } from '../models/qdrant-config.model.js';

import { QdrantClientService } from './qdrant-client.service.js';

/** Qdrant filter shape for the lexicon vector query (url in/not-in). */
interface LexiconQueryFilter {
  must?: Array<Record<string, unknown>>;
  must_not?: Array<Record<string, unknown>>;
}

/** Scroll page size for id/vector sweeps (backfill + delete resolution). */
const SCROLL_PAGE = 500;

/**
 * The only layer that talks Qdrant payloads for the memory-lexicon
 * collection. One point = one verbatim chunk of a fetched source document;
 * the point id is deterministic (`url|contentHash|chunkIndex`) so a re-store
 * of unchanged content overwrites in place and a changed document supersedes
 * by hash.
 *
 * This repository also owns the lexicon's constellation link graph: it keeps
 * the precomputed semantic edges (Postgres) in sync with the chunks (Qdrant)
 * — computing edges on upsert and cascading them on supersede — so the
 * dashboard reads a ready graph with zero Qdrant round-trips.
 */
@Injectable()
export class LexiconRepository {
  private readonly logger = new Logger(LexiconRepository.name);

  /** Whether the global lexicon scope was backfilled this process lifetime. */
  private backfilled = false;

  constructor(
    private readonly clientService: QdrantClientService,
    private readonly links: MemoryLinkRepository,
    @Inject(QDRANT_CONFIG) private readonly config: QdrantConfig,
  ) {}

  private get collection(): string {
    return this.clientService.lexiconCollection;
  }

  /** Batch upsert of chunk points (idempotent by deterministic id). */
  async upsertChunks(
    points: LexiconChunkPoint[],
    options?: { skipLinks?: boolean },
  ): Promise<void> {
    if (points.length === 0) return;
    if (!(await this.clientService.hasLexiconCollection())) return;
    await this.clientService.getClient().upsert(this.collection, {
      wait: true,
      points: points.map((point) => ({
        id: point.id,
        vector: point.vector,
        payload: {
          content: point.content,
          url: point.url,
          domain: point.domain,
          title: point.title,
          fetched_at: point.fetchedAt,
          content_hash: point.contentHash,
          chunk_index: point.chunkIndex,
          chunk_count: point.chunkCount,
          partition_scope: point.partitionScope,
          source_type: point.sourceType,
        },
      })),
    });

    // Graph bookkeeping is warn-and-continue: a missing edge degrades to a
    // dot without links, never a failed store. Snippets opt out — they are
    // short search results, not content worth linking.
    if (options?.skipLinks) return;
    try {
      await this.syncLinks(
        points.map((point) => ({
          id: point.id,
          vector: point.vector,
        })),
      );
    } catch (error) {
      this.logger.warn(
        `Lexicon link-graph sync skipped: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /** All chunk points of one url (payload only, no vectors). */
  async scrollByUrl(url: string): Promise<LexiconChunkHit[]> {
    if (!(await this.clientService.hasLexiconCollection())) return [];
    const result = await this.clientService
      .getClient()
      .scroll(this.collection, {
        filter: { must: [{ key: 'url', match: { value: url } }] },
        with_payload: true,
        with_vector: false,
      });
    return result.points.map((point) => this.toHit(point));
  }

  /**
   * Delete every chunk of a url whose content hash is NOT the given one —
   * the supersede step: new-hash chunks were already upserted, this removes
   * the superseded old-hash chunks. Idempotent; the sweep re-runs it to heal
   * a crash between upsert and delete. Resolves the removed ids first so the
   * edge cascade drops exactly the superseded chunks' edges.
   */
  async deleteByUrlExcludingHash(url: string, hash: string): Promise<void> {
    if (!(await this.clientService.hasLexiconCollection())) return;
    const client = this.clientService.getClient();
    const filter = {
      must: [
        { key: 'url', match: { value: url } },
        { key: 'content_hash', match: { except: [hash] } },
        // Supersede only content chunks — snippets are indexed independently.
        { key: 'source_type', match: { value: 'content' } },
      ],
    };
    const ids: string[] = [];
    let offset: string | number | null = null;
    for (;;) {
      const scroll = await client.scroll(this.collection, {
        filter,
        limit: SCROLL_PAGE,
        offset: offset ?? undefined,
        with_payload: false,
        with_vector: false,
      });
      for (const point of scroll.points) ids.push(String(point.id));
      offset = (scroll.next_page_offset as string | number | null) ?? null;
      if (!offset) break;
    }
    if (ids.length === 0) return;
    await client.delete(this.collection, { points: ids, wait: true });
    await this.links.deleteByPointIds(ids);
  }

  /**
   * Scroll-based listing for the sysctl lexicon surface (payload only, no
   * vectors). Optional domain / partitionScope tightenings; capped page.
   */
  async listChunks(input: {
    domain?: string;
    partitionScope?: string;
    limit?: number;
  }): Promise<LexiconChunkHit[]> {
    if (!(await this.clientService.hasLexiconCollection())) return [];
    const must: Array<Record<string, unknown>> = [];
    if (input.domain)
      must.push({ key: 'domain', match: { value: input.domain } });
    if (input.partitionScope)
      must.push({
        key: 'partition_scope',
        match: { value: input.partitionScope },
      });
    const result = await this.clientService
      .getClient()
      .scroll(this.collection, {
        filter: must.length > 0 ? { must } : undefined,
        limit: Math.min(input.limit ?? 500, 1000),
        with_payload: true,
        with_vector: false,
      });
    return result.points.map((point) => this.toHit(point));
  }

  /**
   * Read the precomputed semantic link graph of the global lexicon scope. On
   * the first read of a scope that has chunks but no edges yet (fresh deploy
   * or embed-model switch), run a one-time backfill.
   */
  async listLinks(): Promise<MemoryLinkEdge[]> {
    const edges = await this.links.listEdges(
      'lexicon',
      this.collection,
      'global',
      this.config.linkReadMax,
    );
    if (edges.length > 0 || this.backfilled) return edges;
    this.backfilled = true;
    if (await this.clientService.hasLexiconCollection()) {
      await this.backfillLinks();
      return this.links.listEdges(
        'lexicon',
        this.collection,
        'global',
        this.config.linkReadMax,
      );
    }
    return edges;
  }

  /**
   * Recompute the global lexicon link graph with the CURRENT link
   * threshold: purge the stored edges, then rerun the bounded backfill —
   * the migration path after raising `MEMORY_LINK_SCORE_THRESHOLD`.
   */
  async recomputeLinks(): Promise<MemoryLinkEdge[]> {
    await this.links.deleteByScope('lexicon', this.collection, 'global');
    if (await this.clientService.hasLexiconCollection()) {
      await this.backfillLinks();
    }
    return this.links.listEdges(
      'lexicon',
      this.collection,
      'global',
      this.config.linkReadMax,
    );
  }

  /** Vector query with an optional url filter (Lane A / Lane B). */
  async queryByFilter(
    vector: number[],
    filter: LexiconQueryFilter,
    limit: number,
    scoreThreshold: number,
  ): Promise<LexiconChunkHit[]> {
    if (!(await this.clientService.hasLexiconCollection())) return [];
    const result = await this.clientService.getClient().query(this.collection, {
      query: vector,
      limit,
      score_threshold: scoreThreshold,
      with_payload: true,
      filter,
    });
    return result.points.map((point) => this.toHit(point));
  }

  /** Neighbor-expansion scroll: content chunks of a url around a chunk index. */
  async scrollNeighbors(
    url: string,
    chunkIndex: number,
    expansion: number,
  ): Promise<LexiconChunkHit[]> {
    if (!(await this.clientService.hasLexiconCollection())) return [];
    const result = await this.clientService
      .getClient()
      .scroll(this.collection, {
        filter: {
          must: [
            { key: 'url', match: { value: url } },
            { key: 'source_type', match: { value: 'content' } },
            {
              key: 'chunk_index',
              range: {
                gte: chunkIndex - expansion,
                lte: chunkIndex + expansion,
              },
            },
          ],
        },
        with_payload: true,
        with_vector: false,
      });
    return result.points.map((point) => this.toHit(point));
  }

  /**
   * Recompute the semantic edges of a batch of chunks: query each chunk's
   * top-k neighbors (global scope), replace the batch's existing edges,
   * persist. Idempotent (deterministic ids + unique constraint + delete-first).
   */
  private async syncLinks(
    points: Array<{ id: string; vector: number[] }>,
  ): Promise<void> {
    if (points.length === 0) return;
    const client = this.clientService.getClient();
    const edges: MemoryLinkRow[] = [];
    const seen = new Set<string>();
    for (const point of points) {
      const vector = point.vector;
      if (!Array.isArray(vector) || typeof vector[0] !== 'number') continue;
      const result = await client.query(this.collection, {
        query: vector as number[],
        limit: this.config.linkNeighbors + 1,
        score_threshold: this.config.linkScoreThreshold,
        with_payload: false,
      });
      for (const hit of result.points) {
        const targetId = String(hit.id);
        if (targetId === point.id) continue;
        const [source, target] = [point.id, targetId].sort();
        const pairKey = `${source}|${target}`;
        if (seen.has(pairKey)) continue;
        seen.add(pairKey);
        edges.push({
          lane: 'lexicon',
          collection: this.collection,
          scopeKey: 'global',
          source,
          target,
          score: hit.score ?? 0,
          kind: 'semantic',
        });
      }
    }
    await this.links.deleteByPointIds(points.map((point) => point.id));
    await this.links.upsertEdges(edges);
  }

  /**
   * One-time cold-start backfill: scroll the lexicon's chunks with vectors
   * (bounded by `linkBackfillMaxPoints`) and compute their edges.
   */
  private async backfillLinks(): Promise<void> {
    if (!(await this.clientService.hasLexiconCollection())) return;
    const client = this.clientService.getClient();
    const points: Array<{ id: string; vector: number[] }> = [];
    let offset: string | number | null = null;
    const maxPoints = this.config.linkBackfillMaxPoints;
    for (;;) {
      const scroll = await client.scroll(this.collection, {
        limit: SCROLL_PAGE,
        offset: offset ?? undefined,
        with_payload: false,
        with_vector: true,
      });
      for (const point of scroll.points) {
        const vector = point.vector;
        if (Array.isArray(vector) && typeof vector[0] === 'number') {
          points.push({ id: String(point.id), vector: vector as number[] });
        }
      }
      offset = (scroll.next_page_offset as string | number | null) ?? null;
      if (!offset || points.length >= maxPoints) break;
    }
    await this.syncLinks(points.slice(0, maxPoints));
  }

  private toHit(point: {
    id: unknown;
    score?: number;
    payload?: Record<string, unknown> | null;
  }): LexiconChunkHit {
    const payload = point.payload ?? {};
    return {
      id: String(point.id),
      content: (payload.content as string) ?? '',
      url: (payload.url as string) ?? '',
      domain: (payload.domain as string) ?? '',
      title: payload.title as string | undefined,
      fetchedAt: (payload.fetched_at as string) ?? '',
      contentHash: (payload.content_hash as string) ?? '',
      chunkIndex: (payload.chunk_index as number) ?? 0,
      chunkCount: (payload.chunk_count as number) ?? 0,
      partitionScope: (payload.partition_scope as string) ?? '',
      sourceType: (payload.source_type as 'content' | 'result') ?? 'content',
      score: point.score,
    };
  }
}
