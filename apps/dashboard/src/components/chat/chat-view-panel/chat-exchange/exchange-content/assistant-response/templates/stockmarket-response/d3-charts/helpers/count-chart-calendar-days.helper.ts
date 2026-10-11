import { DAY_MS } from './time-units.constant';

/** The server-reported coverage span of a ticker's history. */
type AvailableRange = { from: string; to: string };

/**
 * The available data span in calendar days, for the chart's range buttons.
 * The server-reported coverage wins (it reflects the full retention, not the
 * lazily loaded window); the loaded history's own first/last bar times are
 * the fallback.
 */
export function countChartCalendarDays(
  availableRange: AvailableRange | null | undefined,
  points: Array<{ time: string }>,
): number {
  if (availableRange?.from && availableRange.to) {
    const from = Date.parse(availableRange.from);
    const to = Date.parse(availableRange.to);
    if (Number.isFinite(from) && Number.isFinite(to)) {
      return Math.max(0, (to - from) / DAY_MS);
    }
  }
  if (points.length < 2) return 0;
  const from = Date.parse(points[0].time);
  const to = Date.parse(points[points.length - 1].time);
  if (!Number.isFinite(from) || !Number.isFinite(to)) return 0;
  return Math.max(0, (to - from) / DAY_MS);
}
