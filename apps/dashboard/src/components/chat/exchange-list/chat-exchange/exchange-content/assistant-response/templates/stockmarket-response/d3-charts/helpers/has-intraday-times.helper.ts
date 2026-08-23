/** Spacing below which bars are treated as intraday (not daily). */
const INTRADAY_SPACING_MS = 12 * 3_600_000;

/**
 * Whether the visible bars are intraday (sub-daily spacing) rather than daily
 * bars. Daily bars can still carry a time-of-day component in their ISO string
 * (e.g. "2026-08-01T12:00:00Z"), so the spacing — not the string shape — is
 * what distinguishes the 1D intraday view from the 1W/1M/3M daily views.
 */
export function hasIntradayTimes(
  timeOfIndex: (index: number) => string | undefined,
  from: number,
  to: number,
): boolean {
  if (to - from < 2) return false;
  const first = timeOfIndex(from);
  const last = timeOfIndex(to - 1);
  if (!first || !last) return false;
  const spanMs = new Date(last).getTime() - new Date(first).getTime();
  const spacingMs = spanMs / (to - from - 1);
  return spacingMs < INTRADAY_SPACING_MS;
}
