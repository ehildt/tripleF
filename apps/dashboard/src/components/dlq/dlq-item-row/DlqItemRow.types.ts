import type { DlqEntry } from '@/types/dlq-entry.model';

export interface DlqItemRowProps {
  /** The DLQ entry this row renders. */
  entry: DlqEntry;
  /** Whether the entry has already been seen by the user (muted styling). */
  isRead?: boolean;
  /** Whether this row is the currently selected entry. */
  isActive?: boolean;
}

export interface DlqItemRowEmits {
  /** Retry the entry's job. */
  (e: 'retry', id: string): void;
  /** Archive the entry. */
  (e: 'archive', id: string): void;
  /** Delete the entry. */
  (e: 'delete', id: string): void;
}
