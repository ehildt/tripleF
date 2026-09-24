/**
 * Convert a range-button bar count into the from-date (YYYY-MM-DD) the
 * server should have data back to. Bars are trading days (~5 per week), so
 * scale by 7/5 plus a holiday buffer. `null` (the "All" button) means the
 * full retention window the client ever paginates back to (10 years).
 */
export function resolveLookbackFrom(
  bars: number | null,
  today = new Date(),
): string {
  const days = bars === null ? 3650 : Math.ceil(bars * 1.4) + 10;
  const from = new Date(today.getTime() - days * 86_400_000);
  return from.toISOString().slice(0, 10);
}
