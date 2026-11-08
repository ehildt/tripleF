import { type Ref, ref } from 'vue';

import type { DlqEntry } from '@/types/dlq-entry.model';
import type { DlqQueryParams } from '@/types/dlq-query-params.model';
import type { DlqStatusFilter } from '@/types/dlq-status.model';

interface DlqQueryState {
  filterStatus: Ref<DlqStatusFilter>;
  filterSearch: Ref<string>;
  hideRead: Ref<boolean>;
  limit: Ref<number>;
  offset: Ref<number>;
  selectedEntryId: Ref<string | null>;
  getQueryParams: () => DlqQueryParams;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  nextPage: (total: number) => void;
  prevPage: () => void;
  selectEntry: (entry: DlqEntry | null) => void;
}

// These controls intentionally survive leaving the DLQ route, matching the
// former store's lifetime. Server records remain exclusively in TanStack Query.
const filterStatus = ref<DlqStatusFilter>('');
const filterSearch = ref('');
const hideRead = ref(false);
const limit = ref(20);
const offset = ref(0);
const selectedEntryId = ref<string | null>(null);

/** Own DLQ filters, pagination controls, and selected entry identity. */
export function useDlqQueryState(): DlqQueryState {
  function getQueryParams(): DlqQueryParams {
    return {
      limit: limit.value,
      offset: offset.value,
      ...(filterStatus.value ? { status: filterStatus.value } : {}),
      ...(filterSearch.value ? { search: filterSearch.value } : {}),
    };
  }

  function setPage(page: number): void {
    offset.value = (page - 1) * limit.value;
  }

  function setPageSize(size: number): void {
    limit.value = size;
    offset.value = 0;
  }

  function nextPage(total: number): void {
    if (offset.value + limit.value < total) offset.value += limit.value;
  }

  function prevPage(): void {
    if (offset.value > 0) offset.value -= limit.value;
  }

  function selectEntry(entry: DlqEntry | null): void {
    selectedEntryId.value = entry?.id ?? null;
  }

  return {
    filterStatus,
    filterSearch,
    hideRead,
    limit,
    offset,
    selectedEntryId,
    getQueryParams,
    setPage,
    setPageSize,
    nextPage,
    prevPage,
    selectEntry,
  };
}
