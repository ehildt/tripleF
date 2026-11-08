import type { DlqEntry } from '@/types/dlq-entry.model';

/** Build the read key for one record version and its accumulated attempts. */
export function getDlqEntryReadKey(entry: DlqEntry): string {
  return `${entry.id}::${entry.failedAt ?? ''}::${entry.attemptsMade}`;
}
