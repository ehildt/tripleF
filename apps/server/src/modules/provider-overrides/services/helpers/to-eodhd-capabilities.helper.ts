import type { EodhdUserInfo } from '../../../stock-data/providers/eodhd/eodhd-client.js';
import type { EodhdCapabilities } from '../eodhd-discovery.service.types.js';

import { deriveEodhdEndpoints } from './derive-eodhd-endpoints.helper.js';
import { deriveEodhdPlan } from './derive-eodhd-plan.helper.js';

/**
 * Map the raw `/internal-user` payload to the app's cached capability
 * snapshot — adds the derived plan label, the endpoint switchboard, and
 * the discovery timestamp.
 */
export function toEodhdCapabilities(info: EodhdUserInfo): EodhdCapabilities {
  const feeds = info.availableDataFeeds ?? [];
  return {
    plan: deriveEodhdPlan(info.dailyRateLimit),
    subscriptionType: info.subscriptionType,
    subscriptionMode: info.subscriptionMode,
    paymentMethod: info.paymentMethod,
    name: info.name,
    email: info.email,
    apiRequests: info.apiRequests,
    apiRequestsDate: info.apiRequestsDate,
    dailyRateLimit: info.dailyRateLimit,
    extraLimit: info.extraLimit,
    endpoints: deriveEodhdEndpoints(feeds),
    availableDataFeeds: feeds,
    checkedAt: new Date().toISOString(),
  };
}
