import type { DlqStatus } from './dlq-status.model';

export interface DlqQueryParams {
  status?: DlqStatus;
  queueName?: string;
  jobName?: string;
  limit?: number;
  offset?: number;
  search?: string;
}
