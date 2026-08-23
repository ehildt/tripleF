import type { DlqEntry } from '../../../../types/dlq-entry.model';

export function isDlqEntryImmutable(entry: DlqEntry | null): boolean {
  return entry?.status === 'Removed';
}
