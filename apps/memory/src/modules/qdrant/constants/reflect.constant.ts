/** Reflection batch limit — env baseline MEMORY_REFLECT_BATCH_LIMIT. */
export const REFLECT_BATCH_LIMIT_DEFAULT = 100;
export const REFLECT_BATCH_LIMIT_MIN = 1;
export const REFLECT_BATCH_LIMIT_MAX = 500;

/** Reflection candidate pool — env baseline MEMORY_REFLECT_MAX_CANDIDATES. */
export const REFLECT_MAX_CANDIDATES_DEFAULT = 5;
export const REFLECT_MAX_CANDIDATES_MIN = 1;
export const REFLECT_MAX_CANDIDATES_MAX = 100;

/** Clamp a reflection batch-limit override into the supported envelope. */
export function clampReflectBatchLimit(value: number): number {
  if (!Number.isFinite(value)) return REFLECT_BATCH_LIMIT_DEFAULT;
  return Math.min(
    REFLECT_BATCH_LIMIT_MAX,
    Math.max(REFLECT_BATCH_LIMIT_MIN, Math.trunc(value)),
  );
}

/** Clamp a reflection candidate-pool override into the supported envelope. */
export function clampReflectMaxCandidates(value: number): number {
  if (!Number.isFinite(value)) return REFLECT_MAX_CANDIDATES_DEFAULT;
  return Math.min(
    REFLECT_MAX_CANDIDATES_MAX,
    Math.max(REFLECT_MAX_CANDIDATES_MIN, Math.trunc(value)),
  );
}
