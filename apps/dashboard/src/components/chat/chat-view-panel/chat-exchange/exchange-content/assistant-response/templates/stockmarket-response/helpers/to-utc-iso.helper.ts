/**
 * EODHD intraday datetimes arrive as UTC "YYYY-MM-DD HH:MM:SS". `new Date()`
 * would parse that space-separated form as the browser's local timezone, so
 * normalize it to an ISO string with an explicit UTC suffix before the chart
 * converts it to a timestamp.
 */
export function toUtcIso(time: string): string {
  const normalized = time.includes(' ') ? time.replace(' ', 'T') : time;
  return /(?:[zZ]|[+-]\d{2}:?\d{2})$/.test(normalized)
    ? normalized
    : `${normalized}Z`;
}
