import { Injectable } from '@nestjs/common';

import { MemoryHttpTransportService } from './memory-http-transport.service.js';
import type { MemoryOverridesConfig } from './memory-overrides.service.types.js';

/**
 * Memory-app settings lane (`/memory-overrides`) — the memory app's system
 * variables (settings → system), effective values over env defaults. Throws
 * on failure by design; the caller degrades to the built-in defaults.
 */
@Injectable()
export class MemoryOverridesService {
  constructor(private readonly transport: MemoryHttpTransportService) {}

  /** The memory app's system variables — effective values over env defaults. */
  async getOverrides(): Promise<MemoryOverridesConfig> {
    return this.transport.request(`${this.transport.baseUrl}/memory-overrides`);
  }
}
