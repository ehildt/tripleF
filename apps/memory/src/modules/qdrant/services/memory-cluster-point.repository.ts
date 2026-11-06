import { Injectable } from '@nestjs/common';

import { readDenseVector } from '../helpers/read-dense-vector.helper.js';

import type { MemoryScopePoint } from './memory-cluster-point.repository.types.js';
import { QdrantClientService } from './qdrant-client.service.js';

/** Scroll page size for cluster-detection sweeps. */
const SCROLL_PAGE = 500;

/** Owns cluster-detection point reads and cluster-assignment writes. */
@Injectable()
export class MemoryClusterPointRepository {
  constructor(private readonly clientService: QdrantClientService) {}

  private get collection(): string {
    return this.clientService.collection;
  }

  /** Scroll non-superseded scope points with vectors up to a hard limit. */
  async scrollScopePoints(
    memoryPartition: string,
    limit: number,
  ): Promise<MemoryScopePoint[]> {
    if (!(await this.clientService.hasCollection())) return [];
    const client = this.clientService.getClient();
    const filter = {
      must: [{ key: 'memory_partition', match: { value: memoryPartition } }],
      must_not: [{ key: 'superseded', match: { value: true } }],
    };
    const points: MemoryScopePoint[] = [];
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
          category: payload.category as string | undefined,
          community: payload.community as string | undefined,
          subject: payload.subject as string | undefined,
          tags: (payload.tags as string[]) ?? [],
        });
        if (points.length >= limit) return points;
      }
      offset = (scroll.next_page_offset as string | number | null) ?? null;
      if (!offset) break;
    }
    return points;
  }

  /** Batch point ids by cluster and write each cluster assignment. */
  async setClusterIds(assignments: Map<string, string>): Promise<void> {
    if (assignments.size === 0) return;
    if (!(await this.clientService.hasCollection())) return;
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
        wait: true,
      });
    }
  }
}
