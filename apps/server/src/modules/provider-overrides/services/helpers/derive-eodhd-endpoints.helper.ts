import {
  EODHD_ENDPOINT_KEYS,
  EODHD_FEED_TO_ENDPOINT,
} from '../../constants/provider-overrides.constants.js';
import type { EodhdEndpointKey } from '../eodhd-discovery.service.types.js';

/**
 * Map EODHD's raw data-feed names to the endpoint taxonomy: an endpoint is
 * reachable when any of its unlocking feeds appears in the account's feeds.
 */
export function deriveEodhdEndpoints(
  feeds: string[],
): Record<EodhdEndpointKey, boolean> {
  const available = new Set(feeds ?? []);
  const endpoints = {} as Record<EodhdEndpointKey, boolean>;
  for (const key of EODHD_ENDPOINT_KEYS) {
    endpoints[key] = EODHD_FEED_TO_ENDPOINT[key].some((feed) =>
      available.has(feed),
    );
  }
  return endpoints;
}
