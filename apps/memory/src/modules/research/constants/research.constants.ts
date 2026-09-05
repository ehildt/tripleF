/** Injection token for the resolved research config. */
export const RESEARCH_CONFIG = Symbol('RESEARCH_CONFIG');

/** Gap-limit bounds (max gaps triaged per run). */
export const RESEARCH_GAP_LIMIT_MIN = 1;
export const RESEARCH_GAP_LIMIT_MAX = 50;
/** Deep-dive depth bounds (max follow-up hops per research chain). */
export const RESEARCH_MAX_DEPTH_MIN = 1;
export const RESEARCH_MAX_DEPTH_MAX = 3;
/** Fetch-budget bounds (max pages fetched per run). */
export const RESEARCH_FETCH_BUDGET_MIN = 1;
export const RESEARCH_FETCH_BUDGET_MAX = 20;
/** Friction-limit bounds (max contested pairs screened per run). */
export const RESEARCH_FRICTION_LIMIT_MIN = 1;
export const RESEARCH_FRICTION_LIMIT_MAX = 20;

export function clampResearchGapLimit(value: number): number {
  return Math.min(
    RESEARCH_GAP_LIMIT_MAX,
    Math.max(RESEARCH_GAP_LIMIT_MIN, Math.round(value)),
  );
}

export function clampResearchMaxDepth(value: number): number {
  return Math.min(
    RESEARCH_MAX_DEPTH_MAX,
    Math.max(RESEARCH_MAX_DEPTH_MIN, Math.round(value)),
  );
}

export function clampResearchFetchBudget(value: number): number {
  return Math.min(
    RESEARCH_FETCH_BUDGET_MAX,
    Math.max(RESEARCH_FETCH_BUDGET_MIN, Math.round(value)),
  );
}

export function clampResearchFrictionLimit(value: number): number {
  return Math.min(
    RESEARCH_FRICTION_LIMIT_MAX,
    Math.max(RESEARCH_FRICTION_LIMIT_MIN, Math.round(value)),
  );
}
