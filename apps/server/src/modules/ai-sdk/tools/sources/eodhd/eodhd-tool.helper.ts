import type { EodhdConfig } from '@triplef/agent/tools';
import type { ToolDependencies } from '@triplef/agent/tools';

import {
  EodhdClient,
  EodhdRateLimitError,
} from '../../../../stock-data/providers/eodhd/eodhd-client.js';

/**
 * Build an EODHD client when the engine and the requested endpoint are both
 * enabled and a key is configured; otherwise null (the tool reports it).
 */
export function createEodhdClient(
  deps: ToolDependencies,
  endpoint: keyof EodhdConfig,
): EodhdClient | null {
  const cfg = deps.getLiveConfig().eodhd;
  if (!cfg.enabled || !cfg.apiKey) return null;
  const endpointCfg = cfg[endpoint];
  if (
    !endpointCfg ||
    typeof endpointCfg !== 'object' ||
    !('enabled' in endpointCfg) ||
    !endpointCfg.enabled
  ) {
    return null;
  }
  return new EodhdClient(cfg.apiKey);
}

/** Normalize an EODHD failure into a tool result the model can surface. */
export function eodhdErrorResult(err: unknown): {
  error: string;
  rateLimited: boolean;
} {
  if (err instanceof EodhdRateLimitError) {
    return { error: err.message, rateLimited: true };
  }
  return {
    error: err instanceof Error ? err.message : String(err),
    rateLimited: false,
  };
}
