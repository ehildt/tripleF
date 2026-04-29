export type DlqStatus =
  | 'PENDING_RETRY'
  | 'REINSERTED'
  | 'ARCHIVED'
  | 'PENDING_DELETION';

export interface VisionDlq {
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

export interface DlqQueryParams {
  status?: DlqStatus;
  queueName?: string;
  requestId?: string;
  limit?: number;
  offset?: number;
  search?: string;
}

export interface DlqListResponse {
  data: VisionDlq[];
  total: number;
  limit: number;
  offset: number;
}
