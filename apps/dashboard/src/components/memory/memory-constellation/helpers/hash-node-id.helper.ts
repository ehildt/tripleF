/**
 * Deterministic 32-bit string hash — the seed for a node's ring/disk
 * placement and its ambient animation phase. Same id → same position every
 * render, so the constellation is stable across reloads.
 */
export function hashNodeId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
