import { format, isValid, parseISO } from 'date-fns';

export function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const date = parseISO(iso);
  return isValid(date) ? format(date, 'P p') : '—';
}
