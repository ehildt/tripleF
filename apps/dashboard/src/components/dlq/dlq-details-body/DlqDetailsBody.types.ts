import type { DlqEntry } from '@/types/dlq-entry.model';

export type DlqDetailTab = 'error' | 'metadata' | 'prompt' | 'payload';

export interface DlqDetailsBodyProps {
  /** The currently selected DLQ entry, or null when nothing is selected. */
  entry: DlqEntry | null;
  /** Names of all known models — used to flag entries referencing unknown models. */
  models: string[];
}
