import type { DebugResult } from '../../../../types/debug.model';

/**
 * Calculate the percentage of the context window used by prompt + eval
 * tokens. Returns null when no token data is available or the context
 * size is invalid.
 */
export function calcRequestTokenPercent(result: DebugResult): number | null {
  const p = result.promptEvalCount;
  const o = result.evalCount;
  if (p == null && o == null) return null;
  const used = (p ?? 0) + (o ?? 0);
  const ctx = Number(result.numCtx ?? 0);
  if (!ctx) return null;
  return Math.round((used / ctx) * 100);
}
