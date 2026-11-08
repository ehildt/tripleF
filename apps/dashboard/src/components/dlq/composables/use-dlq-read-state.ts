import { useReadTracker } from '@/composables/use-read-tracker/use-read-tracker';
import type { DlqEntry } from '@/types/dlq-entry.model';

import { getDlqEntryReadKey } from '../helpers/get-dlq-entry-read-key.helper';
import type { DlqReadState } from './use-dlq-read-state.types';

/** Per-view read service shared by the DLQ list and its action workflow. */
export function useDlqReadState(): DlqReadState {
  const readTracker = useReadTracker('read-dlq-ids');

  function markEntryAsRead(entry: DlqEntry): void {
    readTracker.markAsRead(getDlqEntryReadKey(entry));
  }

  function isEntryRead(entry: DlqEntry): boolean {
    return readTracker.isRead(getDlqEntryReadKey(entry));
  }

  return { markEntryAsRead, isEntryRead };
}
