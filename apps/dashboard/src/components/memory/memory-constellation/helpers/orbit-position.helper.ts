import type { ConstellationPosition } from '../MemoryConstellation.types';

/** Radius for a single leaf whose relaxed position equals its hub. */
const MIN_LEAF_ORBIT_RADIUS = 28;

/**
 * Rotate a leaf position around its topic hub in the x-y plane by `angle`
 * radians — the slow leaf orbit around the main dot. The z coordinate is
 * untouched so the disk stays flat. `scale` scales the orbit *offset* (1 =
 * full orbit, 0 = no orbit) so a collapsing leaf can settle exactly on its
 * category dot instead of lingering on its orbit radius.
 */
export function orbitPosition(
  position: ConstellationPosition,
  center: ConstellationPosition,
  angle: number,
  scale = 1,
): ConstellationPosition {
  const dx = position.x - center.x;
  const dy = position.y - center.y;
  if (dx === 0 && dy === 0) {
    return {
      x: position.x + Math.cos(angle) * MIN_LEAF_ORBIT_RADIUS * scale,
      y: position.y + Math.sin(angle) * MIN_LEAF_ORBIT_RADIUS * scale,
      z: position.z,
    };
  }
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const rx = dx * cos - dy * sin;
  const ry = dx * sin + dy * cos;
  return {
    x: position.x + (rx - dx) * scale,
    y: position.y + (ry - dy) * scale,
    z: position.z,
  };
}
