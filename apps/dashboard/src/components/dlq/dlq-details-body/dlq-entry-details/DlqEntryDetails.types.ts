import type { DlqEntry } from '@/types/dlq-entry.model';

export interface DlqEntryDetailsProps {
  /** The selected DLQ entry — guaranteed non-null by the parent's v-if. */
  entry: DlqEntry;
  /** Names of all known models — used to flag entries referencing unknown models. */
  models: string[];
}

export interface DlqEntryDetailsEmits {
  /** Persist a payload: rebuilt on a filter change, or edited in the payload tab. */
  (e: 'savePayload', id: string, payload: Record<string, unknown>): void;
}
