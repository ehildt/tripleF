import { Injectable, Logger } from '@nestjs/common';

import { fetchWithTimeout } from '../../ai-sdk/tools/sources/fetch-with-timeout.js';
import { SEARCH_TIMEOUT_MS } from '../../ai-sdk/tools/sources/search-timeout.js';

const BRIGHTDATA_API_URL = 'https://api.brightdata.com';

export interface BrightDataCapabilities {
  status?: string;
  customer?: string;
  canMakeRequests?: boolean;
  authFailReason?: string;
  /** Available account balance (money), when the key has billing permission. */
  balance?: number;
  credit?: number;
  prepayment?: number;
  pendingCosts?: number;
  /** Set when the balance endpoint is not readable (e.g. missing permission). */
  balanceError?: string;
  checkedAt?: string;
}

/**
 * Discovers BrightData account status and (when permitted) balance from the
 * API key via /status and /customer/balance, cached with a TTL. The balance
 * endpoint requires a key with Billing permission; if it 403s we surface a
 * balanceError instead of failing the whole check.
 */
@Injectable()
export class BrightDataDiscoveryService {
  private readonly logger = new Logger(BrightDataDiscoveryService.name);

  private cached?: BrightDataCapabilities;
  private cachedKey?: string;
  private lastRefreshAt = 0;
  private refreshInFlight?: Promise<void>;

  private readonly ttlMs = 6 * 60 * 60 * 1000;

  getCached(): BrightDataCapabilities | undefined {
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
          `BrightData capability check failed: ${error instanceof Error ? error.message : error}`,
        );
      })
      .finally(() => {
        this.refreshInFlight = undefined;
      });
  }

  private async doRefresh(key: string): Promise<void> {
    const headers = { Authorization: `Bearer ${key}` };
    const opts = { timeoutMs: SEARCH_TIMEOUT_MS };

    // Account status — always available with a valid account key.
    let status: BrightDataCapabilities['status'];
    let customer: BrightDataCapabilities['customer'];
    let canMakeRequests: BrightDataCapabilities['canMakeRequests'];
    let authFailReason: BrightDataCapabilities['authFailReason'];
    const statusRes = await fetchWithTimeout(
      `${BRIGHTDATA_API_URL}/status`,
      { method: 'GET', headers },
      opts,
    );
    if (statusRes.ok) {
      const body = (await statusRes.json()) as Record<string, unknown>;
      status = body.status as string;
      customer = body.customer as string;
      canMakeRequests = body.can_make_requests as boolean;
      authFailReason = body.auth_fail_reason as string;
    }

    // Balance — needs Billing permission; degrade gracefully on 403.
    let balance: BrightDataCapabilities['balance'];
    let credit: BrightDataCapabilities['credit'];
    let prepayment: BrightDataCapabilities['prepayment'];
    let pendingCosts: BrightDataCapabilities['pendingCosts'];
    let balanceError: BrightDataCapabilities['balanceError'];
    try {
      const balanceRes = await fetchWithTimeout(
        `${BRIGHTDATA_API_URL}/customer/balance`,
        { method: 'GET', headers },
        opts,
      );
      if (balanceRes.ok) {
        const body = (await balanceRes.json()) as Record<string, unknown>;
        balance = body.balance as number;
        credit = body.credit as number;
        prepayment = body.prepayment as number;
        pendingCosts = body.pending_costs as number;
      } else {
        balanceError = `HTTP ${balanceRes.status}`;
      }
    } catch (error) {
      balanceError = error instanceof Error ? error.message : String(error);
    }

    this.cached = {
      status,
      customer,
      canMakeRequests,
      authFailReason,
      balance,
      credit,
      prepayment,
      pendingCosts,
      balanceError,
      checkedAt: new Date().toISOString(),
    };
    this.cachedKey = key;
    this.lastRefreshAt = Date.now();
    this.logger.log(
      `BrightData account discovered (status=${status ?? 'unknown'}, balance=${balance ?? 'n/a'})`,
    );
  }
}
