/**
 * Format an ISO date string as a locale-aware date + time using the app's
 * active locale. Returns an em dash for null/empty/invalid input.
 */
export function formatDate(iso: string | null, locale: string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}
