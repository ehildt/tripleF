import { Injectable, Logger } from '@nestjs/common';
import { fetchWithTimeout } from '@triplef/agent/tools';
import { SEARCH_TIMEOUT_MS } from '@triplef/agent/tools';

export interface SerperCapabilities {
  /** Remaining paid/free credits on the account. */
  remainingCredits?: number;
  /** Per-minute request limit. */
  rateLimit?: number;
  checkedAt?: string;
}

/**
 * Discovers Serper account info (remaining credits + rate limit) from the
 * API key via POST /account, cached with a TTL so we don't hit the account
 * endpoint on every request.
 */
@Injectable()
export class SerperDiscoveryService {
  private readonly logger = new Logger(SerperDiscoveryService.name);

  private cached?: SerperCapabilities;
  private cachedKey?: string;
  private lastRefreshAt = 0;
  private refreshInFlight?: Promise<void>;

  private readonly ttlMs = 6 * 60 * 60 * 1000;

  getCached(): SerperCapabilities | undefined {
    return this.cached;
  }

  refresh(key?: string): void {
    if (!key) return;
    if (this.refreshInFlight) return;
    if (
      this.cachedKey === key &&
      this.cached &&
      Date.now() - this.lastRefreshAt < this.ttlMs
    ) {
      return;
    }
    this.refreshInFlight = this.doRefresh(key)
      .catch((error) => {
        this.logger.warn(
          `Serper account check failed: ${error instanceof Error ? error.message : error}`,
        );
      })
      .finally(() => {
        this.refreshInFlight = undefined;
      });
  }

  private async doRefresh(key: string): Promise<void> {
    const res = await fetchWithTimeout(
      'https://google.serper.dev/account',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: key }),
      },
      { timeoutMs: SEARCH_TIMEOUT_MS },
    );
    if (!res.ok) {
      throw new Error(`Serper account endpoint returned HTTP ${res.status}`);
    }
    const data = (await res.json()) as {
      balance?: number;
      rateLimit?: number;
    };
    this.cached = {
      remainingCredits: data.balance,
      rateLimit: data.rateLimit,
      checkedAt: new Date().toISOString(),
    };
    this.cachedKey = key;
    this.lastRefreshAt = Date.now();
    this.logger.log(
      `Serper account discovered (${this.cached.remainingCredits} credits remaining, ${this.cached.rateLimit}/min)`,
    );
  }
}
