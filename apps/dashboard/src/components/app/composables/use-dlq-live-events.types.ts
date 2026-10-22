import type { DlqEntry } from '@/types/dlq-entry.model';

/** Envelope data of the server's `dlq:entry-upserted` topic. */
export interface DlqEntryUpsertedData {
  /** The created/changed row, serialized like the REST list endpoint returns. */
  entry: DlqEntry;
}

/** Envelope data of the server's `dlq:entries-removed` topic. */
export interface DlqEntriesRemovedData {
  /** Ids of rows the retention sweep hard-deleted. */
  ids: string[];
}
