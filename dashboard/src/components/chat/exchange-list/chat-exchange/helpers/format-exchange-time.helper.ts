/**
 * Format a unix timestamp as a localized time string (HH:MM:SS).
 */
export function formatExchangeTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString();
}
