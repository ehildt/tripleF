import type { DlqStatus } from './dlq-status.model';

export interface DlqEntry {
  requestId: string;
  queueName: string;
  jobId: string | null;
  status: DlqStatus;
  payload: Record<string, unknown> | null;
  failedReason: string | null;
  failedAt: string | null;
  attemptsMade: number;
  totalAttempts: number;
  nextRetryAt: string | null;
  createdAt: string;
}
