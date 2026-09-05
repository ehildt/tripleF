import type { ProjectedPoint } from '../MemoryConstellation.types';

/** Nearest projected node to the pointer, or -1 when none is within reach. */
export function hitTestNode(
  mouseX: number,
  mouseY: number,
  projected: readonly ProjectedPoint[],
): number {
  let bestDist = 30;
  let bestIdx = -1;
  for (let i = 0; i < projected.length; i++) {
    const dx = mouseX - projected[i].x;
    const dy = mouseY - projected[i].y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = i;
    }
  }
  return bestIdx;
}
