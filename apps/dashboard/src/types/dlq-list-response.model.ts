import type { DlqEntry } from './dlq-entry.model';

export interface DlqListResponse {
  data: DlqEntry[];
  total: number;
  limit: number;
  offset: number;
}
