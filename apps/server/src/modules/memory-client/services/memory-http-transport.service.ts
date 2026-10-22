import { Inject, Injectable } from '@nestjs/common';

import type { MemoryClientConfig } from '../configs/memory-client-config.adapter.js';
import { MEMORY_CLIENT_CONFIG } from '../constants/memory-client.constants.js';

/**
 * Internal HTTP plumbing for the memory app: the base URL, the feature flag,
 * and the fail-fast fetch wrapper every lane service builds on.
 * Module-internal — the lane services are the public surface.
 */
@Injectable()
export class MemoryHttpTransportService {
  constructor(
    @Inject(MEMORY_CLIENT_CONFIG) private readonly config: MemoryClientConfig,
  ) {}

  /** Feature flag — disabled memory means lane reads degrade and writes throw before any call. */
  get enabled(): boolean {
    return this.config.enabled;
  }

  /** Versioned app prefix — lane services append their endpoint family. */
  get baseUrl(): string {
    return `${this.config.url}/api/v1`;
  }

  /** JSON fetch wrapper — throws on non-2xx so lanes decide their own failure semantics. */
  async request<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(url, init);
    if (!res.ok) {
      throw new Error(`Memory service error ${res.status} for ${url}`);
    }
    return res.json() as Promise<T>;
  }
}
