import type { DlqEntry } from '@/types/dlq-entry.model';

export interface DlqListBodyProps {
  /** DLQ entries currently loaded for the active page. */
  entries: DlqEntry[];
  /** Id of the currently selected entry, or null when nothing is selected. */
  selectedEntryId: string | null;
  /** Load error to surface in place of the list, when the query failed. */
  error?: string | null;
  /** Whether already-read entries are dimmed in the list. */
  hideRead?: boolean;
  /** Read-state lookup passed down by the store-owning orchestrator. */
  isEntryRead: (entry: DlqEntry) => boolean;
  /** Stable per-entry key for the read-state derivation. */
  entryReadKey: (entry: DlqEntry) => string;
}
