import type { DlqEntry } from '@/types/dlq-entry.model';

export interface DlqMetadataSectionProps {
  /** The DLQ entry whose job metadata is rendered field by field. */
  entry: DlqEntry;
}
