import { Injectable } from '@nestjs/common';
import type { MemoryPoint } from '@triplef/agent/tools';

import { buildDeleteFilterQuery } from './helpers/build-delete-filter-query.helper.js';
import { MemoryHttpTransportService } from './memory-http-transport.service.js';
import type {
  DeleteRecordsInput,
  DeleteRecordsOutcome,
  DeleteTextReceipt,
  SearchByTextInput,
  SearchWithClusters,
} from './memory-partition-records.service.types.js';

/**
 * Partition fact-record lane (`/memory/search/text*`, `DELETE
 * /memory/text`): the recall/search probes plus the delete tool path. Probe
 * reads degrade to empty results so a memory outage never breaks a turn;
 * deletes throw so the tool reports honest failures. Writes go through the
 * judged vectorize pipeline, never through this client.
 */
@Injectable()
export class MemoryPartitionRecordsService {
  constructor(private readonly transport: MemoryHttpTransportService) {}

  /** Semantic text search — read path of the memory-partition-recall tool + sanitize probe. */
  async searchByText(input: SearchByTextInput): Promise<MemoryPoint[]> {
    if (!this.transport.enabled) return [];
    try {
      return await this.transport.request<MemoryPoint[]>(
        `${this.transport.baseUrl}/memory/search/text`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(input),
        },
      );
    } catch {
      return [];
    }
  }

  /**
   * Graph-augmented text search: the plain kNN hits plus the cluster
   * summaries of the clusters those hits belong to — the local-search
   * context for cross-cutting questions. Degrades to empty on any failure.
   */
  async searchByTextWithClusters(
    input: SearchByTextInput,
  ): Promise<SearchWithClusters> {
    if (!this.transport.enabled) return { points: [], clusters: [] };
    try {
      return await this.transport.request<SearchWithClusters>(
        `${this.transport.baseUrl}/memory/search/text/clusters`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(input),
        },
      );
    } catch {
      return { points: [], clusters: [] };
    }
  }

  /** Filtered record delete (the memory-partition-delete tool) — no fuzzy wipes. */
  async deleteRecords(
    input: DeleteRecordsInput,
  ): Promise<DeleteRecordsOutcome> {
    if (!this.transport.enabled) throw new Error('Memory feature is disabled');
    const res = await this.transport.request<DeleteTextReceipt>(
      `${this.transport.baseUrl}/memory/text?${buildDeleteFilterQuery(input)}`,
      { method: 'DELETE' },
    );
    return { deleted: res.deleted, texts: res.texts, matched: res.deleted };
  }
}
