import { useQueryClient } from '@tanstack/vue-query';

import { applyDlqEntriesRemoved } from '@/api/queries/helpers/apply-dlq-entries-removed.helper';
import { applyDlqEntryUpsert } from '@/api/queries/helpers/apply-dlq-entry-upsert.helper';
import { replaceDlqEntry } from '@/api/queries/helpers/replace-dlq-entry.helper';
import type { DlqEntry } from '@/types/dlq-entry.model';
import type { DlqListResponse } from '@/types/dlq-list-response.model';
import type { DlqQueryParams } from '@/types/dlq-query-params.model';

type DlqRefetchType = 'active' | 'none';

interface DlqCache {
  applyUpsertedEntry: (entry: DlqEntry, params: DlqQueryParams) => void;
  applyRemovedEntries: (ids: string[], params: DlqQueryParams) => void;
  replaceEntry: (entry: DlqEntry, params: DlqQueryParams) => void;
  invalidateDlqQueries: (refetchType: DlqRefetchType) => void;
}

/** Own DLQ query-cache writes and active/stale invalidation through TanStack. */
export function useDlqCache(): DlqCache {
  const queryClient = useQueryClient();

  function markCachedPagesStale(): void {
    void queryClient.invalidateQueries({
      queryKey: ['dlq'],
      refetchType: 'none',
    });
  }

  function updateCurrentPage(
    params: DlqQueryParams,
    updater: (response: DlqListResponse) => DlqListResponse,
  ): void {
    const queryKey = ['dlq', params] as const;
    queryClient.setQueryData<DlqListResponse>(queryKey, (current) =>
      current ? updater(current) : current,
    );
    markCachedPagesStale();
  }

  function applyUpsertedEntry(entry: DlqEntry, params: DlqQueryParams): void {
    updateCurrentPage(params, (current) =>
      applyDlqEntryUpsert(current, entry, {
        status: params.status,
        search: params.search,
      }),
    );
  }

  function applyRemovedEntries(ids: string[], params: DlqQueryParams): void {
    updateCurrentPage(params, (current) =>
      applyDlqEntriesRemoved(current, ids),
    );
  }

  function replaceEntry(entry: DlqEntry, params: DlqQueryParams): void {
    updateCurrentPage(params, (current) => replaceDlqEntry(current, entry));
  }

  function invalidateDlqQueries(refetchType: DlqRefetchType): void {
    void queryClient.invalidateQueries({ queryKey: ['dlq'], refetchType });
  }

  return {
    applyUpsertedEntry,
    applyRemovedEntries,
    replaceEntry,
    invalidateDlqQueries,
  };
}
