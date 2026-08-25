import type { ToolDependencies } from '../types/types.js';

export const SOURCE = 'brightData';

/**
 * Build a google.com search URL for Bright Data's SERP API. Bright Data
 * requires `q` to be the first argument and returns parsed JSON when
 * `brd_json=1` is appended. Google now serves all search types through
 * google.com with `udm`/`tbm` selecting the vertical.
 */
export function buildGoogleUrl(query: string, params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  search.set('q', query);
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  search.set('brd_json', '1');
  return `https://www.google.com/search?${search.toString()}`;
}

/** Assert the engine is configured and the endpoint enabled. */
export function engineEnabled(
  deps: ToolDependencies,
  endpoint: keyof ReturnType<ToolDependencies['getLiveConfig']>['brightData'],
): string | undefined {
  const cfg = deps.getLiveConfig().brightData;
  if (!cfg.enabled || !cfg.apiKey || !cfg.serpZone) return undefined;
  const ep = cfg[endpoint];
  if (typeof ep === 'object' && ep !== null && 'enabled' in ep && !ep.enabled) return undefined;
  return cfg.apiKey;
}
