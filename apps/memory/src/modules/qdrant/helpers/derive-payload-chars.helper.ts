/**
 * Derive an LLM-facing payload cap from the model's context window:
 * `numCtx × 4 (chars/token) × ratio`, falling back to an absolute char cap
 * when numCtx is absent. A ratio <= 0 means uncapped (undefined).
 */
export function derivePayloadChars(
  numCtx: number | undefined,
  ratio: number,
  fallbackChars: number,
): number | undefined {
  if (ratio <= 0) return undefined;
  if (numCtx && numCtx > 0) return Math.trunc(numCtx * 4 * ratio);
  if (fallbackChars > 0) return fallbackChars;
  return undefined;
}
