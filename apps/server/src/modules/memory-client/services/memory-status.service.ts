import { Injectable } from '@nestjs/common';

import { MemoryHttpTransportService } from './memory-http-transport.service.js';
import type { MemoryStatusResult } from './memory-status.service.types.js';

/**
 * Memory-app status lane (`/memory/status`) — the Qdrant collection status
 * probe behind the server's readiness indicator. Throws on failure by
 * design: a reachable-but-unhealthy memory app must surface as not-ready.
 */
@Injectable()
export class MemoryStatusService {
  constructor(private readonly transport: MemoryHttpTransportService) {}

  /** Qdrant collection status (health probes). Throws by design. */
  async status(): Promise<MemoryStatusResult> {
    return this.transport.request(`${this.transport.baseUrl}/memory/status`);
  }
}
