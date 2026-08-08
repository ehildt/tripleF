import { addDays, type DateRange } from './date-range.helper.js';

/**
 * Compute the sub-ranges of `target` not covered by `covered`. Inputs are
 * day-granular `[from, to]` windows with both bounds inclusive (YYYY-MM-DD);
 * coverage beyond the target window is clipped away. The result is sorted
 * ascending and never overlaps itself.
 */
export function computeMissingRanges(
  target: DateRange,
  covered: DateRange[],
): DateRange[] {
  if (target.from > target.to) return [];

  const sorted = covered
    .filter((r) => r.from <= target.to && r.to >= target.from)
    .sort((a, b) => a.from.localeCompare(b.from));

  const missing: DateRange[] = [];
  let cursor = target.from;
  for (const range of sorted) {
    if (range.from > cursor) {
      const gapEnd = addDays(range.from, -1);
      missing.push({
        from: cursor,
        to: gapEnd > target.to ? target.to : gapEnd,
      });
    }
    const next = addDays(range.to, 1);
    if (next > cursor) cursor = next;
    if (cursor > target.to) break;
  }
  if (cursor <= target.to) missing.push({ from: cursor, to: target.to });
  return missing.filter((r) => r.from <= r.to);
}
