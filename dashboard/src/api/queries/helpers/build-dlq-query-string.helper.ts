import type { DlqQueryParams } from '../../../types/dlq-query-params.model';

export function buildDlqQueryString(params: DlqQueryParams): string {
  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);
  if (params.queueName) search.set('queueName', params.queueName);
  if (params.jobName) search.set('jobName', params.jobName);
  if (params.search) search.set('search', params.search);
  if (params.limit !== undefined) search.set('limit', String(params.limit));
  if (params.offset !== undefined) search.set('offset', String(params.offset));
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}
