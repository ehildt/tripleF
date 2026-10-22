import { Injectable } from '@nestjs/common';
import { fetchWithTimeout } from '@triplef/agent/tools';
import { SEARCH_TIMEOUT_MS } from '@triplef/agent/tools';

import type { BrightDataCapabilities } from './brightdata-discovery.service.types.js';
import { CapabilityDiscoveryService } from './capability-discovery.service.js';

const BRIGHTDATA_API_URL = 'https://api.brightdata.com';

/**
 * BrightData capability lane: discovers account status and (when permitted)
 * balance from the API key via /status and /customer/balance. The balance
 * endpoint requires a key with Billing permission; a 403 surfaces as
 * `balanceError` instead of failing the whole check. Cache TTL and refresh
 * guards live in the base capability-discovery service.
 */
@Injectable()
export class BrightDataDiscoveryService extends CapabilityDiscoveryService<BrightDataCapabilities> {
  protected async fetchCapabilities(
    key: string,
  ): Promise<BrightDataCapabilities> {
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

    const capabilities: BrightDataCapabilities = {
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
    this.logger.log(
      `BrightData account discovered (status=${status ?? 'unknown'}, balance=${balance ?? 'n/a'})`,
    );
    return capabilities;
  }
}
