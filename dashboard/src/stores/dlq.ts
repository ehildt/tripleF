import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { getApiUrl } from '@/api/api-url';

import { useReadTracker } from '../composables/use-read-tracker';
import type { DlqEntry } from '../types/dlq-entry.model';
import type { DlqListResponse } from '../types/dlq-list-response.model';
import type { DlqQueryParams } from '../types/dlq-query-params.model';

export const useDlqStore = defineStore('dlq', () => {
  const entries = ref<DlqEntry[]>([]);
  const selectedEntry = ref<DlqEntry | null>(null);
  const selectedRequestIds = ref<Set<string>>(new Set());
  const readTracker = useReadTracker('read-dlq-ids');
  const knownIds = ref<string[]>([]);
  const total = ref(0);
  const limit = ref(20);
  const offset = ref(0);
  const filterStatus = ref('');
  const filterQueue = ref('');
  const filterSearch = ref('');
  const hideRead = ref(false);
  const error = ref<string | null>(null);

  const hasNext = computed(() => offset.value + limit.value < total.value);
  const hasPrev = computed(() => offset.value > 0);
  const totalPages = computed(() => Math.ceil(total.value / limit.value));
  const currentPage = computed(
    () => Math.floor(offset.value / limit.value) + 1,
  );
  const selectedCount = computed(() => selectedRequestIds.value.size);
  const allSelected = computed(() => {
    const selectable = entries.value.filter((e) => e.status !== 'Removed');
    return (
      selectable.length > 0 &&
      selectable.every((e) => selectedRequestIds.value.has(e.requestId))
    );
  });

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

    const visibleIds = new Set(res.data.map((e) => e.requestId));
    selectedRequestIds.value = new Set(
      [...selectedRequestIds.value].filter((id) => visibleIds.has(id)),
    );
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

  function clearSelection() {
    selectedEntry.value = null;
    selectedRequestIds.value = new Set();
  }

  function toggleSelection(requestId: string) {
    const next = new Set(selectedRequestIds.value);
    if (next.has(requestId)) next.delete(requestId);
    else next.add(requestId);
    selectedRequestIds.value = next;
  }

  function setAllSelected(selected: boolean) {
    if (selected) {
      selectedRequestIds.value = new Set(
        entries.value
          .filter((e) => e.status !== 'Removed')
          .map((e) => e.requestId),
      );
    } else {
      selectedRequestIds.value = new Set();
    }
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
    if (filterQueue.value) {
      params.queueName = filterQueue.value;
    }
    if (filterSearch.value) {
      params.search = filterSearch.value;
    }
    return params;
  }

  async function fetchDlqCount() {
    try {
      const PAGE_SIZE = 200;

      const url = getApiUrl(`/api/v1/dlq?limit=${PAGE_SIZE}&offset=0`);
      const res = await fetch(url);
      if (!res.ok) return;

      const data = await res.json();
      total.value = data.total;
      const allData: DlqEntry[] = [...data.data];
      const pages = Math.ceil(data.total / PAGE_SIZE);

      if (pages > 1) {
        const fetches: Promise<DlqEntry[]>[] = [];
        for (let i = 1; i < pages; i++) {
          const pageUrl = getApiUrl(
            `/api/v1/dlq?limit=${PAGE_SIZE}&offset=${i * PAGE_SIZE}`,
          );
          fetches.push(
            fetch(pageUrl).then((r) =>
              r.ok ? r.json().then((d) => d.data as DlqEntry[]) : [],
            ),
          );
        }
        const pagesData = await Promise.all(fetches);
        for (const page of pagesData) allData.push(...page);
      }

      knownIds.value = allData.map(entryReadKey);
      readTracker.pruneMissing(knownIds.value);
    } catch {
      // silently ignore count fetch failures
    }
  }

  return {
    entries,
    selectedEntry,
    knownIds,
    selectedRequestIds,
    selectedCount,
    allSelected,
    total,
    limit,
    offset,
    filterStatus,
    filterQueue,
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
    clearSelection,
    toggleSelection,
    setAllSelected,
    setPage,
    setPageSize,
    nextPage,
    prevPage,
    getQueryParams,
    fetchDlqCount,
    unreadDlqCount,
    markEntryAsRead,
    isEntryRead,
  };
});
