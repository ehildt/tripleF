import type { EodhdCapabilities } from '../../../provider-overrides/services/eodhd-discovery.service.js';

const EODHD_ENDPOINT_TOOL: Record<string, string> = {
  search: 'eodhdSearch',
  quote: 'eodhdQuote',
  history: 'eodhdHistory',
  technical: 'eodhdTechnical',
  news: 'eodhdNews',
  fundamentals: 'eodhdFundamentals',
};

/**
 * Drop EODHD tools whose endpoint the key's plan does not include (e.g. no
 * Technical API on the EOD plan), so the intent classifier never wastes a
 * tool call on a feed that returns 403. Only applied when capabilities have
 * been discovered; with no snapshot the tools stay as-is and fail gracefully.
 */
export function filterEodhdToolsByCapabilities(
  toolNames: string[],
  capabilities?: EodhdCapabilities,
): string[] {
  if (!capabilities) return toolNames;
  return toolNames.filter((name) => {
    const endpoint = Object.keys(EODHD_ENDPOINT_TOOL).find(
      (k) => EODHD_ENDPOINT_TOOL[k] === name,
    );
    if (!endpoint) return true;
    return capabilities.endpoints[endpoint] !== false;
  });
}
