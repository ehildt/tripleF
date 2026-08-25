export interface SourceBudgetConfig {
  /** Share of `numCtx × 4` reserved for selected source passages (HARNESS_SOURCE_BUDGET_RATIO, default 0.125). */
  sourceBudgetRatio: number;
  /** Fallback selection budget when `numCtx` is absent (HARNESS_SOURCE_BUDGET_CHARS, default 48000). */
  sourceBudgetChars: number;
  /** Share of `numCtx × 4` for the per-doc ceiling before chunk/embed (HARNESS_REFERENCE_DOC_RATIO, default 0.5). */
  referenceDocRatio: number;
  /** Fallback per-doc ceiling when `numCtx` is absent (HARNESS_REFERENCE_DOC_CHARS, default 100000). */
  referenceDocChars: number;
  /** Share of `numCtx × 4` for the memory-write gathered block (HARNESS_GATHERED_TOTAL_RATIO, default 0.03). */
  gatheredTotalRatio: number;
  /** Fallback gathered-block cap when `numCtx` is absent (HARNESS_GATHERED_TOTAL_CHARS, default 16000). */
  gatheredTotalChars: number;
}
