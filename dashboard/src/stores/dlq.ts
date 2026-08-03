import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { fetchAllDlqEntries } from '../api/queries/fetch-all-dlq-entries.helper';
import { useReadTracker } from '../composables/use-read-tracker';
import type { DlqEntry } from '../types/dlq-entry.model';
import type { DlqListResponse } from '../types/dlq-list-response.model';
import type { DlqQueryParams } from '../types/dlq-query-params.model';

export const useDlqStore = defineStore('dlq', () => {
  const entries = ref<DlqEntry[]>([]);
  const selectedEntry = ref<DlqEntry | null>(null);
  const readTracker = useReadTracker('read-dlq-ids');
  const knownIds = ref<string[]>([]);
  const total = ref(0);
  const limit = ref(20);
  const offset = ref(0);
  const filterStatus = ref('');
  const filterSearch = ref('');
  const hideRead = ref(false);
  const error = ref<string | null>(null);

  const hasNext = computed(() => offset.value + limit.value < total.value);
  const hasPrev = computed(() => offset.value > 0);
  const totalPages = computed(() => Math.ceil(total.value / limit.value));
  const currentPage = computed(
    () => Math.floor(offset.value / limit.value) + 1,
  );
  function entryReadKey(e: DlqEntry): string {
    return `${e.requestId}::${e.failedAt ?? ''}::${e.attemptsMade}`;
  }

  const unreadDlqCount = computed(() => {
    const currentIds = knownIds.value.length
      ? knownIds.value
      : entries.value.map(entryReadKey);
    return readTracker.unreadCount(currentIds);
  });

  function markEntryAsRead(entry: DlqEntry) {
    readTracker.markAsRead(entryReadKey(entry));
  }

  function isEntryRead(entry: DlqEntry) {
    return readTracker.isRead(entryReadKey(entry));
  }

  function setEntries(res: DlqListResponse) {
    entries.value = res.data;
    total.value = res.total;
    limit.value = res.limit;
    offset.value = res.offset;

    if (selectedEntry.value) {
      selectedEntry.value =
        res.data.find((e) => e.requestId === selectedEntry.value!.requestId) ??
        null;
    }
  }

  function updateEntry(updated: DlqEntry) {
    const idx = entries.value.findIndex(
      (e) => e.requestId === updated.requestId,
    );
    if (idx !== -1) {
      entries.value.splice(idx, 1, updated);
    }
    if (selectedEntry.value?.requestId === updated.requestId) {
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

  async function fetchDlqCount() {
    const snapshot = await fetchAllDlqEntries();
    if (!snapshot) return;
    total.value = snapshot.total;
    knownIds.value = snapshot.entries.map(entryReadKey);
    readTracker.pruneMissing(knownIds.value);
  }

  return {
    entries,
    selectedEntry,
    knownIds,
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
    fetchDlqCount,
    unreadDlqCount,
    markEntryAsRead,
    isEntryRead,
    entryReadKey,
  };
});
