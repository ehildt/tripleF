import type { DlqStatus } from '@/types/dlq-status.model';

export interface DlqStatusBadgeProps {
  /** DLQ entry status — drives both the label and the status color class. */
  status: DlqStatus;
}
