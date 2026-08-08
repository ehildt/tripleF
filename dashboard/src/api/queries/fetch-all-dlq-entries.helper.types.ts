import type { DlqEntry } from '../../types/dlq-entry.model';

export interface DlqEntriesSnapshot {
  entries: DlqEntry[];
  total: number;
}
