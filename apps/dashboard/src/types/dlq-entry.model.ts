import type { DlqStatus } from './dlq-status.model';

/**
 * Dead-lettered job record. Identity is the technical pair (queueName, jobId);
 * jobName is the BullMQ job name — for harness turns that name IS the
 * originating request id. The payload of a memory job additionally carries
 * the harness requestId inside `payload.requestId`.
 */
export interface DlqEntry {
  id: string;
  queueName: string;
  jobId: string;
  jobName: string;
  status: DlqStatus;
  payload: Record<string, unknown> | null;
  retryConfig: Record<string, unknown> | null;
  failedReason: string | null;
  failedAt: string | null;
  attemptsMade: number;
  totalAttempts: number;
  failureHistory: Array<Record<string, unknown>> | null;
  nextRetryAt: string | null;
  createdAt: string;
}
