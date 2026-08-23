/**
 * Format a unix timestamp (milliseconds) as a locale-aware time-of-day string
 * using the app's active locale (e.g. "14:03:05" for de, "2:03:05 PM" for en).
 */
export function formatTime(timestamp: number, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(timestamp);
}
