import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { useReadTracker } from '../composables/use-read-tracker';
import type { DlqEntry } from '../types/dlq-entry.model';
import type { DlqListResponse } from '../types/dlq-list-response.model';
import type { DlqQueryParams } from '../types/dlq-query-params.model';
import { entryMatchesDlqFilters } from './helpers/dlq/entry-matches-dlq-filters.helper';

export const useDlqStore = defineStore('dlq', () => {
  const entries = ref<DlqEntry[]>([]);
  const selectedEntry = ref<DlqEntry | null>(null);
  const readTracker = useReadTracker('read-dlq-ids');
  const hasDlqActivity = ref(false);
  const total = ref(0);
  const limit = ref(20);
  const offset = ref(0);
  const filterStatus = ref('');
  const filterSearch = ref('');
  const hideRead = ref(false);
  const error = ref<string | null>(null);
  /** Bumped to request one entries refetch (bulk socket changes). */
  const entriesRefreshNonce = ref(0);

  const hasNext = computed(() => offset.value + limit.value < total.value);
  const hasPrev = computed(() => offset.value > 0);
  const totalPages = computed(() => Math.ceil(total.value / limit.value));
  const currentPage = computed(
    () => Math.floor(offset.value / limit.value) + 1,
  );
  function entryReadKey(e: DlqEntry): string {
    return `${e.id}::${e.failedAt ?? ''}::${e.attemptsMade}`;
  }

  function markEntryAsRead(entry: DlqEntry) {
    readTracker.markAsRead(entryReadKey(entry));
  }

  function isEntryRead(entry: DlqEntry) {
    return readTracker.isRead(entryReadKey(entry));
  }

  /** Flag that the DLQ changed since the user last opened the tab. */
  function markDlqActivity() {
    hasDlqActivity.value = true;
  }

  /** Clear the flag once the user has opened the DLQ tab. */
  function clearDlqActivity() {
    hasDlqActivity.value = false;
  }

  function setEntries(res: DlqListResponse) {
    entries.value = res.data;
    total.value = res.total;
    limit.value = res.limit;
    offset.value = res.offset;

    if (selectedEntry.value) {
      selectedEntry.value =
        res.data.find((e) => e.id === selectedEntry.value!.id) ?? null;
    }
  }

  function updateEntry(updated: DlqEntry) {
    const idx = entries.value.findIndex((e) => e.id === updated.id);
    if (idx !== -1) {
      entries.value.splice(idx, 1, updated);
    }
    if (selectedEntry.value?.id === updated.id) {
      selectedEntry.value = updated;
    }
  }

  function selectEntry(entry: DlqEntry | null) {
    selectedEntry.value = entry;
  }

  function setPage(page: number) {
    offset.value = (page - 1) * limit.value;
  }

  function setPageSize(size: number) {
    limit.value = size;
    offset.value = 0;
  }

  function nextPage() {
    if (hasNext.value) {
      offset.value += limit.value;
    }
  }

  function prevPage() {
    if (hasPrev.value) {
      offset.value -= limit.value;
    }
  }

  function requestEntriesRefresh() {
    entriesRefreshNonce.value += 1;
  }

  /**
   * Apply a pushed entry to the visible list without a fetch: replace the row
   * when it is listed, drop it when it fell out of the active filters, insert
   * it on page one when it newly matches. Only the current page lives in the
   * store, so an upsert for a row on another page only increments the total —
   * pagination refetches correct any drift.
   */
  function applyUpsertedEntry(entry: DlqEntry) {
    const index = entries.value.findIndex((e) => e.id === entry.id);
    const matches = entryMatchesDlqFilters(entry, {
      status: filterStatus.value || undefined,
      search: filterSearch.value || undefined,
    });

    if (!matches) {
      if (index >= 0) {
        entries.value.splice(index, 1);
        total.value = Math.max(0, total.value - 1);
      }
      return;
    }

    if (index >= 0) {
      entries.value[index] = entry;
      return;
    }

    total.value += 1;
    if (offset.value !== 0) return;
    entries.value.unshift(entry);
    while (entries.value.length > limit.value) entries.value.pop();
  }

  /** Drop rows the server's retention sweep erased from under the list. */
  function applyRemovedEntries(ids: string[]) {
    const removedCount = entries.value.filter((e) => ids.includes(e.id)).length;
    entries.value = entries.value.filter((e) => !ids.includes(e.id));
    total.value = Math.max(0, total.value - removedCount);
  }

  function getQueryParams(): DlqQueryParams {
    const params: DlqQueryParams = {
      limit: limit.value,
      offset: offset.value,
    };
    if (filterStatus.value) {
      params.status = filterStatus.value as any;
    }
    if (filterSearch.value) {
      params.search = filterSearch.value;
    }
    return params;
  }

  return {
    entries,
    selectedEntry,
    hasDlqActivity,
    entriesRefreshNonce,
    total,
    limit,
    offset,
    filterStatus,
    filterSearch,
    hideRead,
    error,
    hasNext,
    hasPrev,
    totalPages,
    currentPage,
    setEntries,
    updateEntry,
    selectEntry,
    setPage,
    setPageSize,
    nextPage,
    prevPage,
    getQueryParams,
    requestEntriesRefresh,
    applyUpsertedEntry,
    applyRemovedEntries,
    markDlqActivity,
    clearDlqActivity,
    markEntryAsRead,
    isEntryRead,
    entryReadKey,
  };
});
