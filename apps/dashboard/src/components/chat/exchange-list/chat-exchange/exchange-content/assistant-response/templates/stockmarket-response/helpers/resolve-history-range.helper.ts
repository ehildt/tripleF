/** A loaded series' first-to-last time span. */
export interface HistoryTimeRange {
  from: string;
  to: string;
}

/**
 * The time span a loaded history covers, as the available-range fallback for
 * the chart's range controls when the coverage endpoint is unreachable. The
 * daily series — not the displayed one — must be passed in: in the 1D
 * intraday view the displayed bars span a single day, which would collapse
 * the range buttons mid-interaction.
 */
export function resolveHistoryRange(
  history: Array<{ time: string }>,
): HistoryTimeRange | null {
  const first = history[0]?.time;
  const last = history[history.length - 1]?.time;
  if (!first || !last) return null;
  return { from: first, to: last };
}
