import { addDays, type DateRange } from './date-range.helper.js';

/**
 * Merge overlapping or directly adjacent day ranges into the smallest set of
 * covering intervals. Adjacency counts (a range ending 2024-01-05 and one
 * starting 2024-01-06 touch) so the ledger stays compact across backfills.
 */
export function mergeDateRanges(ranges: DateRange[]): DateRange[] {
  const sorted = ranges
    .filter((r) => r.from <= r.to)
    .sort((a, b) => a.from.localeCompare(b.from));

  const merged: DateRange[] = [];
  for (const range of sorted) {
    const last = merged[merged.length - 1];
    if (!last || range.from > addDays(last.to, 1)) {
      merged.push({ ...range });
    } else if (range.to > last.to) {
      last.to = range.to;
    }
  }
  return merged;
}
