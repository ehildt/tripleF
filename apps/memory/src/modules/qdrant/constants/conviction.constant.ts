/**
 * Distinguishing tags on conviction-synthesis records — one per lane:
 * - `bridge` (partition lane): a synthesized claim that CLOSES A GAP between
 *   the user's facts — connective tissue of the fact graph. Excluded from
 *   the fact recall path (`must_not tags: bridge`), surfaced via
 *   searchBridges and the constellation's evidence edges.
 * - `conviction` (cognition lane): a durable conclusion about the user/self
 *   model — the AI's own derived understanding. Probed at respond time via
 *   searchConvictions and promoted into the profile's `convictions` facet.
 */
export const BRIDGE_TAG = 'bridge';
export const CONVICTION_TAG = 'conviction';

/** Conviction-synthesis batch limit — env baseline MEMORY_CONVICTION_BATCH_LIMIT. */
export const CONVICTION_BATCH_LIMIT_DEFAULT = 100;
export const CONVICTION_BATCH_LIMIT_MIN = 1;
export const CONVICTION_BATCH_LIMIT_MAX = 500;

/** Max statements emitted per synthesis run — env baseline MEMORY_CONVICTION_MAX_PER_CLUSTER. */
export const CONVICTION_MAX_PER_CLUSTER_DEFAULT = 5;
export const CONVICTION_MAX_PER_CLUSTER_MIN = 1;
export const CONVICTION_MAX_PER_CLUSTER_MAX = 1000;

/** Clamp a conviction batch-limit override into the supported envelope. */
export function clampConvictionBatchLimit(value: number): number {
  if (!Number.isFinite(value)) return CONVICTION_BATCH_LIMIT_DEFAULT;
  return Math.min(
    CONVICTION_BATCH_LIMIT_MAX,
    Math.max(CONVICTION_BATCH_LIMIT_MIN, Math.trunc(value)),
  );
}

/** Clamp a conviction-per-cluster override into the supported envelope. */
export function clampConvictionMaxPerCluster(value: number): number {
  if (!Number.isFinite(value)) return CONVICTION_MAX_PER_CLUSTER_DEFAULT;
  return Math.min(
    CONVICTION_MAX_PER_CLUSTER_MAX,
    Math.max(CONVICTION_MAX_PER_CLUSTER_MIN, Math.trunc(value)),
  );
}
