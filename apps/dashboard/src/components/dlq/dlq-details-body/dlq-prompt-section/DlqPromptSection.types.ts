import type { DlqEntry } from '@/types/dlq-entry.model';

export interface DlqPromptSectionProps {
  /** The DLQ entry whose original prompt is rendered. */
  entry: DlqEntry;
}
