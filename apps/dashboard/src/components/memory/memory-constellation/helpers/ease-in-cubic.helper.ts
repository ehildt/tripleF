/** Ease-in cubic (slow start, fast end) — the spiral "collide". */
export function easeInCubic(t: number): number {
  return t * t * t;
}
