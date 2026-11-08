import type { DlqEntry } from '@/types/dlq-entry.model';

export interface DlqReadState {
  /** Mark the current failure/attempt version of an entry as read. */
  markEntryAsRead: (entry: DlqEntry) => void;
  /** Whether the current failure/attempt version of an entry is read. */
  isEntryRead: (entry: DlqEntry) => boolean;
}
