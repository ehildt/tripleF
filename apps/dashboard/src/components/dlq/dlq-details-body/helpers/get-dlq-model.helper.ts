import type { DlqEntry } from '../../../../types/dlq-entry.model';
import { getDlqFilters } from './get-dlq-filters.helper';

export function getDlqModel(entry: DlqEntry | null): string | null {
  const f = getDlqFilters(entry);
  if (!f) return null;
  const raw = (f.model as unknown) ?? null;
  if (!raw) return null;
  if (typeof raw === 'object' && raw !== null) {
    const obj = raw as Record<string, unknown>;
    return ((obj.model as string) || (obj.name as string) || null) ?? null;
  }
  if (typeof raw === 'string' && (raw.startsWith('{') || raw.startsWith('['))) {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      return (parsed.model as string) || (parsed.name as string) || raw;
    } catch {
      return raw;
    }
  }
  return raw as string;
}
