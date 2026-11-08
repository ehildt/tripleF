import type { ComputedRef } from 'vue';

import type { DlqEntry } from '@/types/dlq-entry.model';

import type { DlqReadState } from './use-dlq-read-state.types';

export interface DlqActionsContext {
  /** Entries derived from the active TanStack Query page. */
  entries: ComputedRef<DlqEntry[]>;
  /** Selected record derived from selected id and the active page. */
  selectedEntry: ComputedRef<DlqEntry | null>;
  /** The same per-view read service used by the list. */
  readState: DlqReadState;
  /** Dismiss the visible query error before starting a retry. */
  dismissError: () => void;
}

export interface DlqActions {
  /** Toggle selection and mark a newly selected entry read. */
  onSelect: (entry: DlqEntry) => void;
  /** Retry one record and restore its harness session when applicable. */
  onRetry: (id: string) => Promise<void>;
  /** Archive one record unless it is already removed. */
  onArchive: (id: string) => Promise<void>;
  /** Mark one record for deletion and refresh the active page. */
  onDelete: (id: string) => Promise<void>;
  /** Save an edited payload and update the cached record. */
  onSavePayload: (
    id: string,
    payload: Record<string, unknown>,
  ) => Promise<void>;
}
