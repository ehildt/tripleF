import { Injectable } from '@nestjs/common';

import {
  BRIDGE_TAG,
  CONVICTION_TAG,
} from '../constants/conviction.constant.js';
import { readDenseVector } from '../helpers/read-dense-vector.helper.js';
import type { MemoryPoint } from '../models/memory.model.js';

import type {
  MemorySupersededState,
  MemorySynthesisPoint,
  MemorySynthesisRecord,
  ScrollSynthesizableInput,
} from './memory-synthesis.repository.types.js';
import { QdrantClientService } from './qdrant-client.service.js';

/** Scroll page size for complete synthesis-record drift checks. */
const SCROLL_PAGE = 500;

/** Identity filter for one synthesized-record scope. */
interface SynthesisScope {
  /** Partition or cognition payload key. */
  key: 'memory_partition' | 'memory_cognition';
  /** Scope key matched against the payload field. */
  value: string;
}

/** Owns synthesis eligibility, evidence-drift reads, and superseded-state lookup. */
@Injectable()
export class MemorySynthesisRepository {
  constructor(private readonly clientService: QdrantClientService) {}

  private get collection(): string {
    return this.clientService.collection;
  }

  /** Scroll reflected evidence not yet offered to conviction synthesis. */
  async scrollSynthesizable(
    input: ScrollSynthesizableInput,
  ): Promise<MemorySynthesisPoint[]> {
    if (!(await this.clientService.hasCollection())) return [];
    const result = await this.clientService
      .getClient()
      .scroll(this.collection, {
        filter: {
          must: [
            {
              key: 'memory_partition',
              match: { value: input.memoryPartition },
            },
            { key: 'is_reflected', match: { value: true } },
          ],
          must_not: [
            { key: 'superseded', match: { value: true } },
            { key: 'is_synthesized', match: { value: true } },
            { key: 'tags', match: { any: [BRIDGE_TAG] } },
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
        category: payload.category as string | undefined,
        community: payload.community as string | undefined,
        subject: payload.subject as string | undefined,
        kind: payload.kind as string | undefined,
        stability: payload.stability as string | undefined,
      };
    });
  }

  /** Scroll every non-superseded bridge and its evidence references. */
  async scrollBridges(
    memoryPartition: string,
  ): Promise<MemorySynthesisRecord[]> {
    return this.scrollSynthesisRecords(
      { key: 'memory_partition', value: memoryPartition },
      BRIDGE_TAG,
    );
  }

  /** Scroll every non-superseded conviction and its evidence references. */
  async scrollConvictions(
    memoryCognition: string,
  ): Promise<MemorySynthesisRecord[]> {
    return this.scrollSynthesisRecords(
      { key: 'memory_cognition', value: memoryCognition },
      CONVICTION_TAG,
    );
  }

  /** Paginate all synthesized records so drift checks see the full scope. */
  private async scrollSynthesisRecords(
    scope: SynthesisScope,
    tag: string,
  ): Promise<MemorySynthesisRecord[]> {
    if (!(await this.clientService.hasCollection())) return [];
    const client = this.clientService.getClient();
    const filter = {
      must: [
        { key: scope.key, match: { value: scope.value } },
        { key: 'tags', match: { any: [tag] } },
      ],
      must_not: [{ key: 'superseded', match: { value: true } }],
    };
    const records: MemorySynthesisRecord[] = [];
    let offset: string | number | null = null;
    for (;;) {
      const scroll = await client.scroll(this.collection, {
        filter,
        limit: SCROLL_PAGE,
        offset: offset ?? undefined,
        with_payload: true,
      });
      for (const point of scroll.points) {
        const payload = point.payload ?? {};
        records.push({
          id: String(point.id),
          evidenceIds: (payload.evidence_ids as string[]) ?? [],
        });
      }
      offset = (scroll.next_page_offset as string | number | null) ?? null;
      if (!offset) break;
    }
    return records;
  }

  /** Retrieve evidence by id and report whether each point is superseded. */
  async retrieveSupersededState(
    ids: string[],
  ): Promise<MemorySupersededState[]> {
    if (ids.length === 0) return [];
    if (!(await this.clientService.hasCollection())) return [];
    const result = await this.clientService
      .getClient()
      .retrieve(this.collection, {
        ids,
        with_payload: true,
      });
    return result.map((point) => ({
      id: String(point.id),
      superseded: (point.payload?.superseded as boolean) === true,
    }));
  }
}
