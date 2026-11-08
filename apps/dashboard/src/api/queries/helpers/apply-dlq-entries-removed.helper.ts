import type { DlqListResponse } from '@/types/dlq-list-response.model';

/** Immutably remove socket-reported record ids from a cached DLQ page. */
export function applyDlqEntriesRemoved(
  response: DlqListResponse,
  ids: string[],
): DlqListResponse {
  const removedIds = new Set(ids);
  const removedCount = response.data.filter((entry) =>
    removedIds.has(entry.id),
  ).length;
  if (removedCount === 0) return response;
  return {
    ...response,
    data: response.data.filter((entry) => !removedIds.has(entry.id)),
    total: Math.max(0, response.total - removedCount),
  };
}
