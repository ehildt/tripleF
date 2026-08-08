/** The preset ranges in bars, ascending. */
const RANGE_BARS = [5, 22, 66, 132, 252, 504, 1260];
const RANGE_LABELS = ['1W', '1M', '3M', '6M', '1Y', '2Y', '5Y'];

/**
 * A small tolerance so the zoom transform's fractional window edges never
 * push a clicked range (e.g. exactly 66 bars) over its preset boundary.
 */
const BAR_TOLERANCE = 3;

/**
 * A human label for the visible bar window, used to prefix the range
 * extreme markers and level lines ("1Y HIGH", "3M LOW", …). The window is
 * matched to the smallest preset range that covers it by bar count; windows
 * beyond the largest preset read "All". The caller decides when a full-series
 * window should read "All" regardless of its span.
 */
export function buildRangeLabel(
  points: Array<{ time: string }>,
  from: number,
  to: number,
): string {
  const start = Math.max(0, from);
  const end = Math.min(points.length, to);
  if (points.length === 0 || end <= start) return 'All';
  const bars = end - start;
  for (let i = 0; i < RANGE_BARS.length; i++) {
    if (bars <= RANGE_BARS[i] + BAR_TOLERANCE) return RANGE_LABELS[i];
  }
  return 'All';
}
