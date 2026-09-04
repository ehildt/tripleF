import { Inject, Injectable, Logger } from '@nestjs/common';

import {
  type MemoryFrictionEdge,
  MemoryFrictionRepository,
} from '../../persistence/services/memory-friction.repository.js';
import {
  type MemoryLinkEdge,
  MemoryLinkRepository,
  type MemoryLinkRow,
} from '../../persistence/services/memory-link.repository.js';
import { QDRANT_CONFIG } from '../constants/qdrant.constants.js';
import type {
  EncyclopediaChunkHit,
  EncyclopediaChunkPoint,
} from '../models/encyclopedia-chunk.model.js';
import type { QdrantConfig } from '../models/qdrant-config.model.js';

import { mapEncyclopediaPointToIdVector } from './helpers/map-encyclopedia-point-to-id-vector.helper.js';
import { mapEncyclopediaPointToUpsert } from './helpers/map-encyclopedia-point-to-upsert.helper.js';
import { mapFacetHit } from './helpers/map-facet-hit.helper.js';
import { QdrantClientService } from './qdrant-client.service.js';

/** Qdrant filter shape for the encyclopedia vector query (url in/not-in). */
interface EncyclopediaQueryFilter {
  must?: Array<Record<string, unknown>>;
  must_not?: Array<Record<string, unknown>>;
}

/** Scroll page size for id/vector sweeps (backfill + delete resolution). */
const SCROLL_PAGE = 500;

/**
 * The only layer that talks Qdrant payloads for the memory-encyclopedia
 * collection. One point = one verbatim chunk of a fetched source document;
 * the point id is deterministic (`url|contentHash|chunkIndex`) so a re-store
 * of unchanged content overwrites in place and a changed document supersedes
 * by hash.
 *
 * This repository also owns the encyclopedia's constellation link graph: it keeps
 * the precomputed semantic edges (Postgres) in sync with the chunks (Qdrant)
 * — computing edges on upsert and cascading them on supersede — so the
 * dashboard reads a ready graph with zero Qdrant round-trips.
 */
@Injectable()
export class EncyclopediaRepository {
  private readonly logger = new Logger(EncyclopediaRepository.name);

  /** Whether the global encyclopedia scope was backfilled this process lifetime. */
  private backfilled = false;

  constructor(
    private readonly clientService: QdrantClientService,
    private readonly links: MemoryLinkRepository,
    private readonly frictions: MemoryFrictionRepository,
    @Inject(QDRANT_CONFIG) private readonly config: QdrantConfig,
  ) {}

  get collection(): string {
    return this.clientService.encyclopediaCollection;
  }

  /** Batch upsert of chunk points (idempotent by deterministic id). */
  async upsertChunks(
    points: EncyclopediaChunkPoint[],
    options?: { skipLinks?: boolean },
  ): Promise<void> {
    if (points.length === 0) return;
    if (!(await this.clientService.hasEncyclopediaCollection())) return;
    await this.clientService.getClient().upsert(this.collection, {
      wait: true,
      points: points.map(mapEncyclopediaPointToUpsert),
    });

    // Graph bookkeeping is warn-and-continue: a missing edge degrades to a
    // dot without links, never a failed store. Snippets opt out — they are
    // short search results, not content worth linking.
    if (options?.skipLinks) return;
    try {
      await this.syncLinks(points.map(mapEncyclopediaPointToIdVector));
    } catch (error) {
      this.logger.warn(
        `Encyclopedia link-graph sync skipped: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /** All chunk points of one url (payload only, no vectors). */
  async scrollByUrl(url: string): Promise<EncyclopediaChunkHit[]> {
    if (!(await this.clientService.hasEncyclopediaCollection())) return [];
    const result = await this.clientService
      .getClient()
      .scroll(this.collection, {
        filter: {
          must: [
            { key: 'url', match: { value: url } },
            // Content chunks only — search-result snippets (source_type
            // 'result') share the url but are indexed independently; their
            // refreshed fetched_at would otherwise skew the reuse/sweep
            // latest-hash checks (and the sweep could delete real content).
            { key: 'source_type', match: { value: 'content' } },
          ],
        },
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
    if (!(await this.clientService.hasEncyclopediaCollection())) return;
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
    await this.frictions.deleteByPointIds(ids);
  }

  /**
   * Scroll-based listing for the settings encyclopedia surface (payload only, no
   * vectors). Optional domain / partitionScope tightenings; capped page.
   */
  async listChunks(input: {
    domain?: string;
    partitionScope?: string;
    limit?: number;
  }): Promise<EncyclopediaChunkHit[]> {
    if (!(await this.clientService.hasEncyclopediaCollection())) return [];
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
   * Read the friction records of the global encyclopedia scope (the reflection
   * pass writes them; the dashboard renders them as warning edges).
   */
  async listFrictions(): Promise<MemoryFrictionEdge[]> {
    return this.frictions.listFrictions(
      'encyclopedia',
      this.collection,
      'global',
      this.config.linkReadMax,
    );
  }

  /**
   * Read the precomputed semantic link graph of the global encyclopedia scope. On
   * the first read of a scope that has chunks but no edges yet (fresh deploy
   * or embed-model switch), run a one-time backfill.
   */
  async listLinks(): Promise<MemoryLinkEdge[]> {
    const edges = await this.links.listEdges(
      'encyclopedia',
      this.collection,
      'global',
      this.config.linkReadMax,
    );
    if (edges.length > 0 || this.backfilled) return edges;
    this.backfilled = true;
    if (await this.clientService.hasEncyclopediaCollection()) {
      await this.backfillLinks();
      return this.links.listEdges(
        'encyclopedia',
        this.collection,
        'global',
        this.config.linkReadMax,
      );
    }
    return edges;
  }

  /**
   * Recompute the global encyclopedia link graph with the CURRENT link
   * threshold: purge the stored edges, then rerun the bounded backfill —
   * the migration path after raising `MEMORY_LINK_SCORE_THRESHOLD`.
   */
  async recomputeLinks(): Promise<MemoryLinkEdge[]> {
    await this.links.deleteByScope('encyclopedia', this.collection, 'global');
    if (await this.clientService.hasEncyclopediaCollection()) {
      await this.backfillLinks();
    }
    return this.links.listEdges(
      'encyclopedia',
      this.collection,
      'global',
      this.config.linkReadMax,
    );
  }

  /** Vector query with an optional url filter (Lane A / Lane B). */
  async queryByFilter(
    vector: number[],
    filter: EncyclopediaQueryFilter,
    limit: number,
    scoreThreshold: number,
  ): Promise<EncyclopediaChunkHit[]> {
    if (!(await this.clientService.hasEncyclopediaCollection())) return [];
    const result = await this.clientService.getClient().query(this.collection, {
      query: vector,
      limit,
      score_threshold: scoreThreshold,
      with_payload: true,
      filter: {
        ...filter,
        must_not: [
          ...(filter.must_not ?? []),
          // Superseded chunks were adjudicated stale — excluded from recall.
          { key: 'superseded', match: { value: true } },
        ],
      },
    });
    return result.points.map((point) => this.toHit(point));
  }

  /** Neighbor-expansion scroll: content chunks of a url around a chunk index. */
  async scrollNeighbors(
    url: string,
    chunkIndex: number,
    expansion: number,
  ): Promise<EncyclopediaChunkHit[]> {
    if (!(await this.clientService.hasEncyclopediaCollection())) return [];
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
          // Superseded chunks were adjudicated stale — excluded from recall.
          must_not: [{ key: 'superseded', match: { value: true } }],
        },
        with_payload: true,
        with_vector: false,
      });
    return result.points.map((point) => this.toHit(point));
  }

  /**
   * All snippet points of one url (payload only, no vectors) — the classify
   * job's snippet-pass input. Snippets of a url accumulate (historical search
   * results), newest text first is not guaranteed; the classifier sees them
   * all and labels by content.
   */
  async scrollSnippetsByUrl(url: string): Promise<EncyclopediaChunkHit[]> {
    if (!(await this.clientService.hasEncyclopediaCollection())) return [];
    const result = await this.clientService
      .getClient()
      .scroll(this.collection, {
        filter: {
          must: [
            { key: 'url', match: { value: url } },
            { key: 'source_type', match: { value: 'result' } },
          ],
        },
        limit: SCROLL_PAGE,
        with_payload: true,
        with_vector: false,
      });
    return result.points.map((point) => this.toHit(point));
  }

  /**
   * Unclassified snippet urls of the global encyclopedia — the classify job's
   * discovery queue for tier-1 points. Tier-1 snippets never write ledger
   * rows, so their pending signal is the missing label itself: a snippet
   * point is pending while it has no `category` (is_empty matches absent
   * keys). Classifying a url fans the labels out to every point of the url,
   * so classified urls drop back out of this queue on their own — and a
   * newly accumulated snippet of a classified url re-enters it for
   * re-classification. Paginated; `limit` caps the urls returned per run.
   */
  async scrollUnclassifiedSnippetUrls(limit: number): Promise<string[]> {
    if (!(await this.clientService.hasEncyclopediaCollection())) return [];
    const client = this.clientService.getClient();
    const urls: string[] = [];
    const seen = new Set<string>();
    let offset: string | number | null = null;
    for (;;) {
      const scroll = await client.scroll(this.collection, {
        filter: {
          must: [
            { key: 'source_type', match: { value: 'result' } },
            { is_empty: { key: 'category' } },
          ],
        },
        limit: SCROLL_PAGE,
        offset: offset ?? undefined,
        with_payload: true,
        with_vector: false,
      });
      for (const point of scroll.points) {
        const url = point.payload?.url;
        if (typeof url !== 'string' || !url || seen.has(url)) continue;
        seen.add(url);
        urls.push(url);
        if (urls.length >= limit) return urls;
      }
      offset = (scroll.next_page_offset as string | number | null) ?? null;
      if (!offset) break;
    }
    return urls;
  }

  /**
   * Unfetched snippet urls of the global encyclopedia — the research job's
   * gap queue. A url is a gap while it has `source_type: 'result'` points
   * (search results the user's own searches surfaced) but no `source_type:
   * 'content'` points (the page was never fetched). Over-fetches candidates
   * to survive the content check, then returns up to `limit` gaps with their
   * title/snippet/partition provenance.
   */
  async scrollUnfetchedSnippetUrls(limit: number): Promise<
    Array<{
      url: string;
      title?: string;
      snippet: string;
      partitionScope?: string;
    }>
  > {
    if (!(await this.clientService.hasEncyclopediaCollection())) return [];
    const candidates = await this.collectSnippetCandidates(limit);
    return this.filterUnfetched(candidates, limit);
  }

  /** Distinct snippet urls (with provenance), over-fetched 2× for the content check. */
  private async collectSnippetCandidates(limit: number): Promise<
    Array<{
      url: string;
      title?: string;
      snippet: string;
      partitionScope?: string;
    }>
  > {
    const client = this.clientService.getClient();
    const candidates = new Map<
      string,
      { url: string; title?: string; snippet: string; partitionScope?: string }
    >();
    let offset: string | number | null = null;
    for (;;) {
      const scroll = await client.scroll(this.collection, {
        filter: {
          must: [{ key: 'source_type', match: { value: 'result' } }],
        },
        limit: SCROLL_PAGE,
        offset: offset ?? undefined,
        with_payload: true,
        with_vector: false,
      });
      this.absorbSnippetPoints(scroll.points, candidates, limit * 2);
      if (candidates.size >= limit * 2) break;
      offset = (scroll.next_page_offset as string | number | null) ?? null;
      if (!offset) break;
    }
    return [...candidates.values()];
  }

  /** Fold one scroll page's snippet points into the candidate map (first-seen wins). */
  private absorbSnippetPoints(
    points: Array<{ payload?: Record<string, unknown> | null }>,
    candidates: Map<
      string,
      { url: string; title?: string; snippet: string; partitionScope?: string }
    >,
    cap: number,
  ): void {
    for (const point of points) {
      const payload = point.payload ?? {};
      const url = payload.url;
      if (typeof url !== 'string' || !url || candidates.has(url)) continue;
      candidates.set(url, {
        url,
        title: typeof payload.title === 'string' ? payload.title : undefined,
        snippet: typeof payload.content === 'string' ? payload.content : '',
        partitionScope:
          typeof payload.partition_scope === 'string'
            ? payload.partition_scope
            : undefined,
      });
      if (candidates.size >= cap) return;
    }
  }

  /** Keep only candidates with no content chunks (never fetched), capped at `limit`. */
  private async filterUnfetched(
    candidates: Array<{
      url: string;
      title?: string;
      snippet: string;
      partitionScope?: string;
    }>,
    limit: number,
  ): Promise<
    Array<{
      url: string;
      title?: string;
      snippet: string;
      partitionScope?: string;
    }>
  > {
    const gaps: Array<{
      url: string;
      title?: string;
      snippet: string;
      partitionScope?: string;
    }> = [];
    for (const candidate of candidates) {
      const content = await this.scrollByUrl(candidate.url);
      if (content.length === 0) gaps.push(candidate);
      if (gaps.length >= limit) break;
    }
    return gaps;
  }

  /**
   * Load the contents of specific chunks by id (no vector search) — the
   * research job's contested-memory path resolves encyclopedia frictions'
   * pairs this way. Missing ids are simply absent from the map.
   */
  async getContentsByIds(ids: string[]): Promise<Map<string, string>> {
    const contents = new Map<string, string>();
    if (ids.length === 0) return contents;
    if (!(await this.clientService.hasEncyclopediaCollection()))
      return contents;
    const scroll = await this.clientService
      .getClient()
      .scroll(this.collection, {
        filter: { must: [{ has_id: ids }] },
        limit: ids.length,
        with_payload: true,
        with_vector: false,
      });
    for (const point of scroll.points) {
      const content = (point.payload?.content as string | undefined)?.trim();
      if (content) contents.set(String(point.id), content);
    }
    return contents;
  }

  /**
   * Distinct category values of the global encyclopedia with point counts — the
   * classify job's reuse-first vocabulary. One facet call (Qdrant ≥1.12,
   * keyword index on `category`), exact counts.
   */
  async facetCategories(): Promise<Array<{ value: string; count: number }>> {
    if (!(await this.clientService.hasEncyclopediaCollection())) return [];
    const result = await this.clientService.getClient().facet(this.collection, {
      key: 'category',
      limit: 1000,
      exact: true,
    });
    return result.hits.map(mapFacetHit);
  }

  /**
   * Distinct topic values of the global encyclopedia with point counts — the
   * classify job's topic-reuse vocabulary (mirrors `facetCategories`; keyword
   * index on `topic`).
   */
  async facetTopics(): Promise<Array<{ value: string; count: number }>> {
    if (!(await this.clientService.hasEncyclopediaCollection())) return [];
    const result = await this.clientService.getClient().facet(this.collection, {
      key: 'topic',
      limit: 1000,
      exact: true,
    });
    return result.hits.map(mapFacetHit);
  }

  /**
   * Write the classification labels onto every chunk of one url — a
   * payload-only change, no vector rewrite, idempotent. The classify job
   * labels a document once and fans the labels out to all its chunks.
   */
  async setClassificationByUrl(
    url: string,
    category: string,
    topic: string,
  ): Promise<void> {
    if (!(await this.clientService.hasEncyclopediaCollection())) return;
    await this.clientService.getClient().setPayload(this.collection, {
      payload: { category, topic },
      filter: { must: [{ key: 'url', match: { value: url } }] },
    });
  }

  /** Set payload keys on specific chunks (the reflect job's friction writes). */
  async setPayloadForPoints(
    ids: string[],
    payload: Record<string, unknown>,
  ): Promise<void> {
    if (ids.length === 0) return;
    if (!(await this.clientService.hasEncyclopediaCollection())) return;
    await this.clientService.getClient().setPayload(this.collection, {
      payload,
      points: ids,
    });
  }

  /**
   * Scroll every non-superseded content chunk of the global encyclopedia with
   * vectors — the cluster-detection input (id + vector + content + category
   * + topic-as-tags). Paginated; `limit` is a hard cap.
   */
  async scrollScopePoints(limit: number): Promise<
    Array<{
      id: string;
      vector: number[];
      text: string;
      category?: string;
      tags: string[];
    }>
  > {
    if (!(await this.clientService.hasEncyclopediaCollection())) return [];
    const client = this.clientService.getClient();
    const filter = {
      must: [{ key: 'source_type', match: { value: 'content' } }],
      must_not: [{ key: 'superseded', match: { value: true } }],
    };
    const points: Array<{
      id: string;
      vector: number[];
      text: string;
      category?: string;
      tags: string[];
    }> = [];
    let offset: string | number | null = null;
    for (;;) {
      const scroll = await client.scroll(this.collection, {
        filter,
        limit: Math.min(SCROLL_PAGE, limit - points.length),
        offset: offset ?? undefined,
        with_payload: true,
        with_vector: true,
      });
      for (const point of scroll.points) {
        const vector = point.vector;
        if (!Array.isArray(vector) || typeof vector[0] !== 'number') continue;
        const payload = point.payload ?? {};
        const topic = payload.topic as string | undefined;
        points.push({
          id: String(point.id),
          vector: vector as number[],
          text: (payload.content as string) ?? '',
          category: payload.category as string | undefined,
          tags: topic ? [topic] : [],
        });
        if (points.length >= limit) return points;
      }
      offset = (scroll.next_page_offset as string | number | null) ?? null;
      if (!offset) break;
    }
    return points;
  }

  /**
   * Write the cluster assignment onto every chunk: one setPayload call per
   * cluster (chunks sharing a cluster id are batched together).
   */
  async setClusterIds(assignments: Map<string, string>): Promise<void> {
    if (assignments.size === 0) return;
    if (!(await this.clientService.hasEncyclopediaCollection())) return;
    const byCluster = new Map<string, string[]>();
    for (const [pointId, clusterId] of assignments) {
      const members = byCluster.get(clusterId) ?? [];
      members.push(pointId);
      byCluster.set(clusterId, members);
    }
    const client = this.clientService.getClient();
    for (const [clusterId, memberIds] of byCluster) {
      await client.setPayload(this.collection, {
        payload: { cluster_id: clusterId },
        points: memberIds,
      });
    }
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
          lane: 'encyclopedia',
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
   * One-time cold-start backfill: scroll the encyclopedia's chunks with vectors
   * (bounded by `linkBackfillMaxPoints`) and compute their edges.
   */
  private async backfillLinks(): Promise<void> {
    if (!(await this.clientService.hasEncyclopediaCollection())) return;
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

  /**
   * Scroll the unreflected chunks (payload + vector) — the reflection job's
   * work queue for the global encyclopedia scope. `must_not is_reflected=true` is
   * the eligibility gate; content chunks only (snippets are never reflected).
   */
  async scrollUnreflected(
    limit: number,
  ): Promise<
    Array<{ id: string; vector: number[]; content: string; fetchedAt: string }>
  > {
    if (!(await this.clientService.hasEncyclopediaCollection())) return [];
    const client = this.clientService.getClient();
    const result = await client.scroll(this.collection, {
      filter: {
        must: [{ key: 'source_type', match: { value: 'content' } }],
        must_not: [
          { key: 'is_reflected', match: { value: true } },
          // Superseded chunks were adjudicated stale — never re-screened.
          { key: 'superseded', match: { value: true } },
        ],
      },
      limit,
      with_payload: true,
      with_vector: true,
    });
    return result.points.map((point) => {
      const payload = point.payload ?? {};
      return {
        id: String(point.id),
        vector: (point.vector as number[]) ?? [],
        content: (payload.content as string) ?? '',
        fetchedAt: (payload.fetched_at as string) ?? '',
      };
    });
  }

  /**
   * Near-neighbor candidate pool for one chunk's friction screen — full
   * content payload (the adjudicator needs the candidate text).
   */
  async queryNeighborFacts(
    vector: number[],
    limit: number,
    scoreThreshold: number,
  ): Promise<Array<{ id: string; content: string; fetchedAt: string }>> {
    if (!(await this.clientService.hasEncyclopediaCollection())) return [];
    const client = this.clientService.getClient();
    const result = await client.query(this.collection, {
      query: vector,
      limit,
      score_threshold: scoreThreshold,
      with_payload: true,
      filter: {
        // Content chunks only — snippets are never adjudication candidates.
        must: [{ key: 'source_type', match: { value: 'content' } }],
        // Stale chunks are never evidence for superseding something else.
        must_not: [{ key: 'superseded', match: { value: true } }],
      },
    });
    return result.points.map((point) => {
      const payload = point.payload ?? {};
      return {
        id: String(point.id),
        content: (payload.content as string) ?? '',
        fetchedAt: (payload.fetched_at as string) ?? '',
      };
    });
  }

  private toHit(point: {
    id: unknown;
    score?: number;
    payload?: Record<string, unknown> | null;
  }): EncyclopediaChunkHit {
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
      category: payload.category as string | undefined,
      topic: payload.topic as string | undefined,
      mimeType: payload.mime_type as string | undefined,
      sizeBytes: payload.size_bytes as number | undefined,
      originalHash: payload.original_hash as string | undefined,
      clusterId: payload.cluster_id as string | undefined,
      isConsolidated: payload.is_consolidated as boolean | undefined,
      isLinked: payload.is_linked as boolean | undefined,
      isReflected: payload.is_reflected as boolean | undefined,
      isFriction: payload.is_friction as boolean | undefined,
      superseded: payload.superseded as boolean | undefined,
      supersededBy: payload.superseded_by as string | undefined,
      score: point.score,
    };
  }
}
