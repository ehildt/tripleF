import { utcFormat } from 'd3-time-format';

/** One time-axis tick label. */
export interface TimeTickLabel {
  text: string;
  /**
   * Whether this tick is a "major" date line (month boundary on daily data,
   * every tick on intraday data) that keeps the strong grid style, as
   * opposed to a minor day line that renders muted.
   */
  isMajor: boolean;
}

const EMPTY: TimeTickLabel = { text: '', isMajor: false };

/**
 * Build the time-axis tick label function for the data. Intraday bars (any
 * time string with more than a date, e.g. "2026-08-01T09:30:00Z") get UTC
 * `HH:MM` and are all major. Daily bars get the month name once per month
 * (at the first tick of each month, a major line) and plain day numbers for
 * the remaining ticks (minor lines), so the axis stays readable instead of
 * repeating "day month" for every tick.
 */
export function buildTimeTickFormatter(
  times: string[],
): (time: string) => TimeTickLabel {
  const hasTimeComponent = times.some(
    (time) => time.length > 10 || /[T ]\d{2}:\d{2}/.test(time),
  );
  if (hasTimeComponent) {
    const format = utcFormat('%H:%M');
    return (time) =>
      time ? { text: format(new Date(time)), isMajor: true } : EMPTY;
  }

  const dayFormat = utcFormat('%-d');
  const monthFormat = utcFormat('%b');
  const monthKey = utcFormat('%Y-%m');
  let lastMonth = '';
  return (time) => {
    if (!time) return EMPTY;
    const date = new Date(time);
    const month = monthKey(date);
    if (month !== lastMonth) {
      lastMonth = month;
      return { text: monthFormat(date), isMajor: true };
    }
    return { text: dayFormat(date), isMajor: false };
  };
}
