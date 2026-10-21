import type { DlqEntry } from '@/types/dlq-entry.model';

export interface DlqItemActionsProps {
  /**
   * The listed entry — action availability derives from its status, and
   * every action emits its id.
   */
  entry: DlqEntry;
}

export interface DlqItemActionsEmits {
  /** Retry the entry's job. */
  (e: 'retry', id: string): void;
  /** Archive the entry. */
  (e: 'archive', id: string): void;
  /** Delete the entry (confirmed via the two-click armed state). */
  (e: 'delete', id: string): void;
}
