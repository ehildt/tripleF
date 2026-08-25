/** Constellation node-load limit — env baseline MEMORY_CONSTELLATION_NODE_LIMIT. */
export const CONSTELLATION_NODE_LIMIT_DEFAULT = 5000;
export const CONSTELLATION_NODE_LIMIT_MIN = 100;
export const CONSTELLATION_NODE_LIMIT_MAX = 10_000;

/** Clamp a constellation node-limit override into the supported envelope. */
export function clampConstellationNodeLimit(value: number): number {
  if (!Number.isFinite(value)) return CONSTELLATION_NODE_LIMIT_DEFAULT;
  return Math.min(
    CONSTELLATION_NODE_LIMIT_MAX,
    Math.max(CONSTELLATION_NODE_LIMIT_MIN, Math.trunc(value)),
  );
}
