import { Injectable } from '@nestjs/common';

import { readDenseVector } from '../helpers/read-dense-vector.helper.js';
import type { MemoryPoint } from '../models/memory.model.js';

import { mapFacetHit } from './helpers/map-facet-hit.helper.js';
import type { FacetValueCount } from './helpers/map-facet-hit.helper.types.js';
import type {
  MemoryLabelCountOptions,
  MemoryLabelField,
  MemoryLabelLeafRow,
  MemoryScrolledPoint,
} from './memory-label.repository.types.js';
import { QdrantClientService } from './qdrant-client.service.js';

/** Scroll page size for category-point sweeps. */
const SCROLL_PAGE = 500;

/** Owns taxonomy-label facets, drill-downs, and payload rewrite operations. */
@Injectable()
export class MemoryLabelRepository {
  constructor(private readonly clientService: QdrantClientService) {}

  private get collection(): string {
    return this.clientService.collection;
  }

  /** Return exact category counts for one partition. */
  async facetCategories(memoryPartition: string): Promise<FacetValueCount[]> {
    if (!(await this.clientService.hasCollection())) return [];
    const result = await this.clientService.getClient().facet(this.collection, {
      key: 'category',
      limit: 1000,
      exact: true,
      filter: {
        must: [{ key: 'memory_partition', match: { value: memoryPartition } }],
      },
    });
    return result.hits.map(mapFacetHit);
  }

  /** Return every distinct memory-partition key in the collection. */
  async facetPartitions(): Promise<string[]> {
    if (!(await this.clientService.hasCollection())) return [];
    const result = await this.clientService.getClient().facet(this.collection, {
      key: 'memory_partition',
      limit: 1000,
      exact: true,
    });
    return result.hits.map((hit) => String(hit.value));
  }

  /** Return exact tag counts for one partition. */
  async facetTags(memoryPartition: string): Promise<FacetValueCount[]> {
    if (!(await this.clientService.hasCollection())) return [];
    const result = await this.clientService.getClient().facet(this.collection, {
      key: 'tags',
      limit: 1000,
      exact: true,
      filter: {
        must: [{ key: 'memory_partition', match: { value: memoryPartition } }],
      },
    });
    return result.hits.map(mapFacetHit);
  }

  /** Return exact community counts for one partition. */
  async facetCommunities(memoryPartition: string): Promise<FacetValueCount[]> {
    if (!(await this.clientService.hasCollection())) return [];
    const result = await this.clientService.getClient().facet(this.collection, {
      key: 'community',
      limit: 1000,
      exact: true,
      filter: {
        must: [{ key: 'memory_partition', match: { value: memoryPartition } }],
      },
    });
    return result.hits.map(mapFacetHit);
  }

  /** Count points carrying one scalar or array-membership label. */
  async countByLabel(
    memoryPartition: string,
    field: MemoryLabelField,
    value: string,
    options?: MemoryLabelCountOptions,
  ): Promise<number> {
    if (!(await this.clientService.hasCollection())) return 0;
    const labelFilter =
      field === 'tags'
        ? { key: 'tags', match: { any: [value] } }
        : { key: field, match: { value } };
    const must: Array<Record<string, unknown>> = [
      { key: 'memory_partition', match: { value: memoryPartition } },
      labelFilter,
    ];
    if (options?.linkedOnly) {
      must.push({ key: 'is_linked', match: { value: true } });
    }
    const result = await this.clientService.getClient().count(this.collection, {
      filter: { must },
      exact: true,
    });
    return result.count;
  }

  /** Return the leaf rows carrying one label value. */
  async listByLabel(
    memoryPartition: string,
    field: MemoryLabelField,
    value: string,
    limit: number,
  ): Promise<MemoryLabelLeafRow[]> {
    if (!(await this.clientService.hasCollection())) return [];
    const labelFilter =
      field === 'tags'
        ? { key: 'tags', match: { any: [value] } }
        : { key: field, match: { value } };
    const result = await this.clientService
      .getClient()
      .scroll(this.collection, {
        filter: {
          must: [
            { key: 'memory_partition', match: { value: memoryPartition } },
            labelFilter,
          ],
        },
        limit,
        with_payload: true,
        with_vector: false,
      });
    return result.points.map((point) => {
      const payload = point.payload ?? {};
      return {
        id: String(point.id),
        text: (payload.text as string) ?? '',
        isLinked: (payload.is_linked as boolean) ?? false,
        createdAt: (payload.created_at as string) ?? '',
      };
    });
  }

  /** Replace one tag in every matching tags array, resumably and idempotently. */
  async retagLabel(
    memoryPartition: string,
    from: string,
    to: string,
  ): Promise<number> {
    if (!(await this.clientService.hasCollection())) return 0;
    const client = this.clientService.getClient();
    let rewritten = 0;
    for (;;) {
      const scroll = await client.scroll(this.collection, {
        filter: {
          must: [
            { key: 'memory_partition', match: { value: memoryPartition } },
            { key: 'tags', match: { any: [from] } },
          ],
        },
        limit: 100,
        with_payload: ['tags'],
        with_vector: false,
      });
      if (scroll.points.length === 0) break;
      for (const point of scroll.points) {
        const tags = ((point.payload?.tags as string[]) ?? []).map((tag) =>
          tag === from ? to : tag,
        );
        await client.setPayload(this.collection, {
          payload: { tags: [...new Set(tags)] },
          points: [point.id as string],
          wait: true,
        });
        rewritten++;
      }
    }
    return rewritten;
  }

  /** Rewrite one community value without changing point vectors. */
  async collapseCommunity(
    memoryPartition: string,
    from: string,
    to: string,
  ): Promise<void> {
    if (!(await this.clientService.hasCollection())) return;
    await this.clientService.getClient().setPayload(this.collection, {
      payload: { community: to },
      filter: {
        must: [
          { key: 'memory_partition', match: { value: memoryPartition } },
          { key: 'community', match: { value: from } },
        ],
      },
      wait: true,
    });
  }

  /** Rewrite one subject value without changing point vectors. */
  async collapseSubject(
    memoryPartition: string,
    from: string,
    to: string,
  ): Promise<void> {
    if (!(await this.clientService.hasCollection())) return;
    await this.clientService.getClient().setPayload(this.collection, {
      payload: { subject: to },
      filter: {
        must: [
          { key: 'memory_partition', match: { value: memoryPartition } },
          { key: 'subject', match: { value: from } },
        ],
      },
      wait: true,
    });
  }

  /** Rewrite one category value without changing point vectors. */
  async collapseCategory(
    memoryPartition: string,
    from: string,
    to: string,
  ): Promise<void> {
    if (!(await this.clientService.hasCollection())) return;
    await this.clientService.getClient().setPayload(this.collection, {
      payload: { category: to },
      filter: {
        must: [
          { key: 'memory_partition', match: { value: memoryPartition } },
          { key: 'category', match: { value: from } },
        ],
      },
      wait: true,
    });
  }

  /** Scroll one category's payload/vector projections up to a hard limit. */
  async scrollCategoryPoints(
    memoryPartition: string,
    category: string,
    limit: number,
  ): Promise<MemoryScrolledPoint[]> {
    if (!(await this.clientService.hasCollection())) return [];
    const client = this.clientService.getClient();
    const filter = {
      must: [
        { key: 'memory_partition', match: { value: memoryPartition } },
        { key: 'category', match: { value: category } },
      ],
    };
    const points: MemoryScrolledPoint[] = [];
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
        const vector = readDenseVector(point.vector);
        if (vector.length === 0) continue;
        const payload = point.payload ?? {};
        points.push({
          id: String(point.id),
          vector,
          text: (payload.text as string) ?? '',
          role: (payload.role as MemoryPoint['role']) ?? 'user',
          tags: (payload.tags as string[]) ?? [],
          createdAt: (payload.created_at as string) ?? '',
          requestId: payload.request_id as string | undefined,
          subject: payload.subject as string | undefined,
          community: payload.community as string | undefined,
          kind: payload.kind as string | undefined,
          stability: payload.stability as string | undefined,
        });
        if (points.length >= limit) return points;
      }
      offset = (scroll.next_page_offset as string | number | null) ?? null;
      if (!offset) break;
    }
    return points;
  }
}
