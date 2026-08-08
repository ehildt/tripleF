import { Injectable, Logger } from '@nestjs/common';

import {
  EodhdClient,
  type EodhdUserInfo,
} from '../../stock-data/providers/eodhd/eodhd-client.js';

export type EodhdEndpointKey =
  | 'search'
  | 'quote'
  | 'history'
  | 'technical'
  | 'intraday'
  | 'news'
  | 'fundamentals';

export const EODHD_ENDPOINT_KEYS: EodhdEndpointKey[] = [
  'search',
  'quote',
  'history',
  'technical',
  'intraday',
  'news',
  'fundamentals',
];

/** Which EODHD data-feed names (from /internal-user) unlock each endpoint. */
const FEED_TO_ENDPOINT: Record<EodhdEndpointKey, string[]> = {
  search: ['Search API'],
  quote: ['Live (delayed) Data API', 'Bulk Live (delayed) Data API'],
  history: ['EOD Historical Data'],
  technical: ['Technical API Data'],
  intraday: ['Intraday Data API'],
  news: ['News API'],
  fundamentals: ['Fundamental Data'],
};

export interface EodhdCapabilities {
  /** Human-readable plan label inferred from the daily quota. */
  plan?: string;
  subscriptionType?: string;
  subscriptionMode?: string;
  paymentMethod?: string;
  name?: string;
  email?: string;
  /** API calls used on the latest active day (resets at midnight GMT). */
  apiRequests?: number;
  apiRequestsDate?: string;
  /** Configured daily call limit. */
  dailyRateLimit?: number;
  /** Remaining purchased buffer calls (used only after the daily limit). */
  extraLimit?: number;
  /** Which of our six endpoints the plan actually includes. */
  endpoints: Record<EodhdEndpointKey, boolean>;
  /** Feeds reported by EODHD (raw), for reference. */
  availableDataFeeds?: string[];
  /** When the capability check last succeeded. */
  checkedAt?: string;
}

/** A daily limit of 20/day marks EODHD's free plan. */
const FREE_PLAN_DAILY_LIMIT = 20;

function derivePlan(dailyRateLimit?: number): string | undefined {
  if (!dailyRateLimit) return undefined;
  if (dailyRateLimit <= FREE_PLAN_DAILY_LIMIT) return 'Free';
  return `${dailyRateLimit.toLocaleString()} calls / day`;
}

function deriveEndpoints(feeds: string[]): Record<EodhdEndpointKey, boolean> {
  const available = new Set(feeds ?? []);
  const endpoints = {} as Record<EodhdEndpointKey, boolean>;
  for (const key of EODHD_ENDPOINT_KEYS) {
    endpoints[key] = FEED_TO_ENDPOINT[key].some((feed) => available.has(feed));
  }
  return endpoints;
}

function toCapabilities(info: EodhdUserInfo): EodhdCapabilities {
  const feeds = info.availableDataFeeds ?? [];
  return {
    plan: derivePlan(info.dailyRateLimit),
    subscriptionType: info.subscriptionType,
    subscriptionMode: info.subscriptionMode,
    paymentMethod: info.paymentMethod,
    name: info.name,
    email: info.email,
    apiRequests: info.apiRequests,
    apiRequestsDate: info.apiRequestsDate,
    dailyRateLimit: info.dailyRateLimit,
    extraLimit: info.extraLimit,
    endpoints: deriveEndpoints(feeds),
    availableDataFeeds: feeds,
    checkedAt: new Date().toISOString(),
  };
}

/**
 * Discovers which EODHD endpoints a key can actually reach by querying the
 * User API (/internal-user) once and caching the result. Lets the app infer
 * plan + active sources from the key instead of hardcoding plan rules. A
 * call to /internal-user costs 1 API call, so the cache is TTL'd and
 * single-flighted.
 */
@Injectable()
export class EodhdDiscoveryService {
  private readonly logger = new Logger(EodhdDiscoveryService.name);

  private cached?: EodhdCapabilities;
  private cachedKey?: string;
  private lastRefreshAt = 0;
  private refreshInFlight?: Promise<void>;

  /** How long a capability snapshot stays fresh before re-checking. */
  private readonly ttlMs = 6 * 60 * 60 * 1000;

  /** Current cached capabilities, without triggering a call. */
  getCached(): EodhdCapabilities | undefined {
    return this.cached;
  }

  /**
   * Fire-and-forget capability check for a key. Skips when the cache is
   * still fresh for the same key, when a check is already in flight, or when
   * no key is configured. Never throws to the caller.
   */
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
          `EODHD capability check failed: ${error instanceof Error ? error.message : error}`,
        );
        // Keep any stale snapshot so the UI still has something to show.
      })
      .finally(() => {
        this.refreshInFlight = undefined;
      });
  }

  private async doRefresh(key: string): Promise<void> {
    const info = await new EodhdClient(key).getUserInfo();
    this.cached = toCapabilities(info);
    this.cachedKey = key;
    this.lastRefreshAt = Date.now();
    this.logger.log(
      `EODHD capabilities discovered (${this.cached.plan ?? 'unknown plan'}): ` +
        EODHD_ENDPOINT_KEYS.map(
          (k) => `${k}:${this.cached!.endpoints[k] ? 'on' : 'off'}`,
        ).join(' '),
    );
  }
}
