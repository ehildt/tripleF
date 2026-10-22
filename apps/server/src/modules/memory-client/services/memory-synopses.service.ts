import { Injectable } from '@nestjs/common';

import { MemoryHttpTransportService } from './memory-http-transport.service.js';
import type {
  SearchSynopsesInput,
  SynopsisHit,
} from './memory-synopses.service.types.js';

/**
 * Cluster-synopsis probe lane (`/memory/search/synopses`) — the Raptor read
 * path over one scope's precomputed community summaries. Degrades to empty
 * so a memory outage never breaks a turn.
 */
@Injectable()
export class MemorySynopsesService {
  constructor(private readonly transport: MemoryHttpTransportService) {}

  /**
   * Semantic search over one scope's cluster-synopsis layer: pass
   * `memoryPartition` for the partition lane, omit it for the global
   * encyclopedia synopses.
   */
  async searchSynopses(input: SearchSynopsesInput): Promise<SynopsisHit[]> {
    if (!this.transport.enabled) return [];
    try {
      return await this.transport.request<SynopsisHit[]>(
        `${this.transport.baseUrl}/memory/search/synopses`,
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
}
