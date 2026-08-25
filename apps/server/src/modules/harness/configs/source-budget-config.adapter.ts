import { getNumberEnv } from '@triplef/helpers/get-number-env';

import type { SourceBudgetConfig } from './source-budget-config.service.types.js';

export function SourceBudgetConfigAdapter(
  env = process.env,
): SourceBudgetConfig {
  return {
    sourceBudgetRatio: getNumberEnv(
      env.HARNESS_SOURCE_BUDGET_RATIO,
      0.125,
    ) as number,
    sourceBudgetChars: getNumberEnv(
      env.HARNESS_SOURCE_BUDGET_CHARS,
      48_000,
    ) as number,
    referenceDocRatio: getNumberEnv(
      env.HARNESS_REFERENCE_DOC_RATIO,
      0.5,
    ) as number,
    referenceDocChars: getNumberEnv(
      env.HARNESS_REFERENCE_DOC_CHARS,
      100_000,
    ) as number,
    gatheredTotalRatio: getNumberEnv(
      env.HARNESS_GATHERED_TOTAL_RATIO,
      0.03,
    ) as number,
    gatheredTotalChars: getNumberEnv(
      env.HARNESS_GATHERED_TOTAL_CHARS,
      16_000,
    ) as number,
  };
}

/**
 * Selection budget in chars: `numCtx × 4 (chars/token) × ratio`, falling back
 * to the absolute env value when `numCtx` is absent.
 */
export function deriveBudgetChars(
  numCtx: number | undefined,
  cfg: SourceBudgetConfig,
): number {
  if (numCtx && numCtx > 0)
    return Math.trunc(numCtx * 4 * cfg.sourceBudgetRatio);
  return cfg.sourceBudgetChars;
}

/**
 * Per-doc ceiling in chars before chunk/embed: `numCtx × 4 × ratio`, falling
 * back to the absolute env value when `numCtx` is absent.
 */
export function deriveReferenceDocChars(
  numCtx: number | undefined,
  cfg: SourceBudgetConfig,
): number {
  if (numCtx && numCtx > 0)
    return Math.trunc(numCtx * 4 * cfg.referenceDocRatio);
  return cfg.referenceDocChars;
}

/**
 * Memory-write gathered-block cap in chars: `numCtx × 4 × ratio`, falling
 * back to the absolute env value when `numCtx` is absent.
 */
export function deriveGatheredChars(
  numCtx: number | undefined,
  cfg: SourceBudgetConfig,
): number {
  if (numCtx && numCtx > 0)
    return Math.trunc(numCtx * 4 * cfg.gatheredTotalRatio);
  return cfg.gatheredTotalChars;
}
