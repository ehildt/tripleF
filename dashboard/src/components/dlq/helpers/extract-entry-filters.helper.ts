import type { DlqEntry } from '@/types/dlq-entry.model';

export interface DlqEntryFilters {
  roomId: string;
  event: string;
  model: string;
}

function readFilter(
  filters: Record<string, unknown> | null,
  key: string,
): string {
  if (!filters) return '';
  const value = filters[key];
  return value == null ? '' : String(value);
}

/**
 * Pull the replay-relevant filters (roomId, event, model) out of a DLQ
 * entry's payload. Missing payload or filters yield empty strings; the
 * event defaults to 'harness' when absent.
 */
export function extractEntryFilters(
  entry: DlqEntry | undefined,
): DlqEntryFilters {
  const filters =
    (entry?.payload as Record<string, unknown> | null)?.filters ?? null;
  const typed =
    filters && typeof filters === 'object'
      ? (filters as Record<string, unknown>)
      : null;
  return {
    roomId: readFilter(typed, 'roomId'),
    event: readFilter(typed, 'event') || 'harness',
    model: readFilter(typed, 'model'),
  };
}
