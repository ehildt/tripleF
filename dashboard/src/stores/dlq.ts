import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { getApiUrl } from '@/api/api-url';

import type {
  DlqListResponse,
  DlqQueryParams,
  VisionDlq,
} from '../types/vision-dlq.model';

export const useDlqStore = defineStore('dlq', () => {
  const entries = ref<VisionDlq[]>([]);
  const selectedEntry = ref<VisionDlq | null>(null);
  const selectedRequestIds = ref<Set<string>>(new Set());
  const total = ref(0);
  const limit = ref(20);
  const offset = ref(0);
  const filterStatus = ref('Status');
  const filterQueue = ref('Queue');
  const filterSearch = ref('');
  const error = ref<string | null>(null);

  const hasNext = computed(() => offset.value + limit.value < total.value);
  const hasPrev = computed(() => offset.value > 0);
  const totalPages = computed(() => Math.ceil(total.value / limit.value));
  const currentPage = computed(
    () => Math.floor(offset.value / limit.value) + 1,
  );
  const selectedCount = computed(() => selectedRequestIds.value.size);
  const allSelected = computed(
    () =>
      entries.value.length > 0 &&
      entries.value.every((e) => selectedRequestIds.value.has(e.requestId)),
  );

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

  function selectEntry(entry: VisionDlq | null) {
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
      selectedRequestIds.value = new Set(entries.value.map((e) => e.requestId));
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
    if (filterStatus.value && filterStatus.value !== 'Status') {
      params.status = filterStatus.value as any;
    }
    if (filterQueue.value && filterQueue.value !== 'Queue') {
      params.queueName = filterQueue.value;
    }
    if (filterSearch.value) {
      params.search = filterSearch.value;
    }
    return params;
  }

  async function fetchDlqCount() {
    try {
      const res = await fetch(
        getApiUrl('/api/v1/jobs/failed?limit=1&offset=0'),
      );
      if (res.ok) {
        const data = await res.json();
        total.value = data.total;
      }
    } catch {
      // silently ignore count fetch failures
    }
  }

  return {
    entries,
    selectedEntry,
    selectedRequestIds,
    selectedCount,
    allSelected,
    total,
    limit,
    offset,
    filterStatus,
    filterQueue,
    filterSearch,
    error,
    hasNext,
    hasPrev,
    totalPages,
    currentPage,
    setEntries,
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
  };
});
