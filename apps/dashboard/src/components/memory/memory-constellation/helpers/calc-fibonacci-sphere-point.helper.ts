import type { ConstellationPosition } from '../MemoryConstellation.types';

/** Golden-angle step for an even, deterministic Fibonacci-sphere spread. */
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

/** Calculate one point on a Fibonacci sphere, centered on the origin. */
export function calcFibonacciSpherePoint(
  index: number,
  count: number,
  radius: number,
): ConstellationPosition {
  const z = 1 - (2 * (index + 0.5)) / Math.max(count, 1);
  const planarRadius = Math.sqrt(Math.max(0, 1 - z * z));
  const angle = index * GOLDEN_ANGLE;
  return {
    x: Math.cos(angle) * planarRadius * radius,
    y: Math.sin(angle) * planarRadius * radius,
    z: z * radius,
  };
}
