/**
 * Map a distance to an opacity value that fades from 1 at zero distance
 * down to 0 at the maximum connection distance.
 */
export function calcConnectionOpacity(
  distance: number,
  maxDistance: number,
): number {
  if (distance <= 0) return 1;
  if (distance >= maxDistance) return 0;
  return 1 - distance / maxDistance;
}
