import type { DlqEntry } from '@/types/dlq-entry.model';

export interface DlqTopBarProps {
  /** The selected DLQ entry whose payload filters are being edited. */
  entry: DlqEntry | null;
  /** Names of all known models — used to flag an entry referencing an unknown model. */
  models: string[];
  /** Whether the entry may no longer be edited (immutable archive states). */
  isImmutable: boolean;
}
