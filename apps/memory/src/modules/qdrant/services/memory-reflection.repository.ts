import { Injectable } from '@nestjs/common';

import { DENSE_VECTOR } from '../constants/qdrant.constants.js';
import { buildMemoryMust } from '../helpers/build-memory-filters.helper.js';
import { readDenseVector } from '../helpers/read-dense-vector.helper.js';
import type { MemoryPoint } from '../models/memory.model.js';

import type {
  MemoryNeighborFact,
  MemoryReflectionPoint,
  QueryNeighborFactsInput,
  ScrollUnreflectedInput,
} from './memory-reflection.repository.types.js';
import { QdrantClientService } from './qdrant-client.service.js';

/** Owns the reflection queue and its near-neighbor evidence reads. */
@Injectable()
export class MemoryReflectionRepository {
  constructor(private readonly clientService: QdrantClientService) {}

  private get collection(): string {
    return this.clientService.collection;
  }

  /** Scroll pending, non-superseded records with their payload and vector. */
  async scrollUnreflected(
    input: ScrollUnreflectedInput,
  ): Promise<MemoryReflectionPoint[]> {
    if (!(await this.clientService.hasCollection())) return [];
    const result = await this.clientService
      .getClient()
      .scroll(this.collection, {
        filter: {
          must: buildMemoryMust(input),
          must_not: [
            { key: 'is_reflected', match: { value: true } },
            { key: 'superseded', match: { value: true } },
          ],
        },
        limit: input.limit,
        with_payload: true,
        with_vector: true,
      });
    return result.points.map((point) => {
      const payload = point.payload ?? {};
      return {
        id: String(point.id),
        vector: readDenseVector(point.vector),
        text: (payload.text as string) ?? '',
        role: (payload.role as MemoryPoint['role']) ?? 'user',
        createdAt: (payload.created_at as string) ?? '',
        subject: payload.subject as string | undefined,
        category: payload.category as string | undefined,
        community: payload.community as string | undefined,
        kind: payload.kind as string | undefined,
        stability: payload.stability as string | undefined,
      };
    });
  }

  /** Query same-scope neighbors with full adjudication payload fields. */
  async queryNeighborFacts(
    input: QueryNeighborFactsInput,
  ): Promise<MemoryNeighborFact[]> {
    if (!(await this.clientService.hasCollection())) return [];
    const client = this.clientService.getClient();
    const layout = await this.clientService.vectorLayout(this.collection);
    const result = await client.query(this.collection, {
      query: input.vector,
      ...(layout.named ? { using: DENSE_VECTOR } : {}),
      limit: input.limit,
      score_threshold: input.scoreThreshold,
      with_payload: true,
      filter: {
        must: buildMemoryMust(input),
        must_not: [{ key: 'superseded', match: { value: true } }],
      },
    });
    return result.points.map((point) => {
      const payload = point.payload ?? {};
      return {
        id: String(point.id),
        text: (payload.text as string) ?? '',
        role: (payload.role as MemoryPoint['role']) ?? 'user',
        createdAt: (payload.created_at as string) ?? '',
        subject: payload.subject as string | undefined,
        category: payload.category as string | undefined,
        community: payload.community as string | undefined,
        kind: payload.kind as string | undefined,
        stability: payload.stability as string | undefined,
      };
    });
  }
}
