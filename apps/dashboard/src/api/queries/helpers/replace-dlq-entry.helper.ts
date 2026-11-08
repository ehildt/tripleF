import type { DlqEntry } from '@/types/dlq-entry.model';
import type { DlqListResponse } from '@/types/dlq-list-response.model';

/** Replace a mutation result in a cached page without changing list totals. */
export function replaceDlqEntry(
  response: DlqListResponse,
  updated: DlqEntry,
): DlqListResponse {
  if (!response.data.some((entry) => entry.id === updated.id)) return response;
  return {
    ...response,
    data: response.data.map((entry) =>
      entry.id === updated.id ? updated : entry,
    ),
  };
}
