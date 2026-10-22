import { Injectable } from '@nestjs/common';
import { fetchWithTimeout } from '@triplef/agent/tools';
import { SEARCH_TIMEOUT_MS } from '@triplef/agent/tools';

import { CapabilityDiscoveryService } from './capability-discovery.service.js';
import type { SerperCapabilities } from './serper-discovery.service.types.js';

/**
 * Serper capability lane: discovers remaining credits + rate limit from the
 * API key via POST /account. Cache TTL and refresh guards live in the base
 * capability-discovery service.
 */
@Injectable()
export class SerperDiscoveryService extends CapabilityDiscoveryService<SerperCapabilities> {
  protected async fetchCapabilities(key: string): Promise<SerperCapabilities> {
    const res = await fetchWithTimeout(
      'https://google.serper.dev/account',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: key }),
      },
      { timeoutMs: SEARCH_TIMEOUT_MS },
    );
    if (!res.ok)
      throw new Error(`Serper account endpoint returned HTTP ${res.status}`);

    const data = (await res.json()) as {
      balance?: number;
      rateLimit?: number;
    };
    const capabilities: SerperCapabilities = {
      remainingCredits: data.balance,
      rateLimit: data.rateLimit,
      checkedAt: new Date().toISOString(),
    };
    this.logger.log(
      `Serper account discovered (${capabilities.remainingCredits} credits remaining, ${capabilities.rateLimit}/min)`,
    );
    return capabilities;
  }
}
