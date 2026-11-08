import type { DlqEntry } from '@/types/dlq-entry.model';
import type { DlqListResponse } from '@/types/dlq-list-response.model';
import type { DlqQueryParams } from '@/types/dlq-query-params.model';

import { entryMatchesDlqFilters } from './entry-matches-dlq-filters.helper';

/** Immutably merge one socket-pushed entry into a cached DLQ page. */
export function applyDlqEntryUpsert(
  response: DlqListResponse,
  entry: DlqEntry,
  filters: Pick<DlqQueryParams, 'status' | 'search'>,
): DlqListResponse {
  const index = response.data.findIndex(
    (candidate) => candidate.id === entry.id,
  );
  const matches = entryMatchesDlqFilters(entry, filters);

  if (!matches) {
    if (index < 0) return response;
    return {
      ...response,
      data: response.data.filter((candidate) => candidate.id !== entry.id),
      total: Math.max(0, response.total - 1),
    };
  }

  if (index >= 0) {
    return {
      ...response,
      data: response.data.map((candidate) =>
        candidate.id === entry.id ? entry : candidate,
      ),
    };
  }

  const next = { ...response, total: response.total + 1 };
  if (response.offset !== 0) return next;
  return {
    ...next,
    data: [entry, ...response.data].slice(0, response.limit),
  };
}
