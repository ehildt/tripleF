/**
 * Minimum vertical gap (px) between the centers of two right-axis badges. A
 * badge is 16px tall; the 2px extra keeps adjacent rect backgrounds visually
 * distinct.
 */
const DEFAULT_BADGE_GAP = 18;

/**
 * Dodge vertically stacked right-axis badges so each stays legible: walk the
 * y positions top→bottom, pushing each badge at least `gap` px below the
 * previous one; if the stack overflows the plot bottom, walk it back up so
 * the last badge fits. Input must be sorted ascending by y; the returned
 * positions are parallel to the input. Only the badge moves — the dashed
 * line stays at its true price.
 */
export function dodgeBadgePositions(
  ys: number[],
  {
    gap = DEFAULT_BADGE_GAP,
    max = Infinity,
  }: { gap?: number; max?: number } = {},
): number[] {
  const dodged: number[] = [];
  let previous = -Infinity;
  for (const y of ys) {
    const badgeY = Math.max(y, previous + gap);
    dodged.push(badgeY);
    previous = badgeY;
  }
  if (dodged.length > 0 && dodged[dodged.length - 1] > max) {
    dodged[dodged.length - 1] = max;
    for (let i = dodged.length - 2; i >= 0; i--) {
      dodged[i] = Math.min(dodged[i], dodged[i + 1] - gap);
    }
  }
  return dodged;
}
