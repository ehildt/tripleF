import { computed, type ComputedRef, onMounted, ref, watch } from 'vue';

import { i18n } from '@/i18n/i18n';
import type { DlqEntry } from '@/types/dlq-entry.model';

import { useDlqQuery } from '../../../api/queries/use-dlq-query';
import { useToast } from '../../../composables/use-toast/use-toast';
import { useDlqActions } from './use-dlq-actions';
import type { DlqActions } from './use-dlq-actions.types';
import { useDlqActivity } from './use-dlq-activity';
import { useDlqLoading } from './use-dlq-loading';
import { useDlqQueryState } from './use-dlq-query-state';
import { useDlqReadState } from './use-dlq-read-state';
import type { DlqReadState } from './use-dlq-read-state.types';

interface DlqEntries {
  entries: ComputedRef<DlqEntry[]>;
  selectedEntry: ComputedRef<DlqEntry | null>;
  total: ComputedRef<number>;
  currentPage: ComputedRef<number>;
  totalPages: ComputedRef<number>;
  errorMessage: ComputedRef<string | null>;
  loading: ReturnType<typeof useDlqLoading>;
  actions: DlqActions;
  readState: DlqReadState;
}

/** Coordinate the DLQ query with selection, loading, errors, and controls. */
export function useDlqEntries(): DlqEntries {
  const queryState = useDlqQueryState();
  const { clearDlqActivity } = useDlqActivity();
  const readState = useDlqReadState();
  const toast = useToast();

  onMounted(clearDlqActivity);

  const {
    data: dlqData,
    error: queryError,
    isError,
    refetch,
  } = useDlqQuery(() => queryState.getQueryParams());

  const loading = useDlqLoading({ refetch });
  const { guardedRefetch, instantRefetch, onDataArrived, onError } = loading;

  const entries = computed(() => dlqData.value?.data ?? []);
  const total = computed(() => dlqData.value?.total ?? 0);
  const currentPage = computed(
    () => Math.floor(queryState.offset.value / queryState.limit.value) + 1,
  );
  const totalPages = computed(() =>
    Math.ceil(total.value / queryState.limit.value),
  );
  const selectedEntry = computed(() => {
    const selectedId = queryState.selectedEntryId.value;
    return selectedId
      ? (entries.value.find((entry) => entry.id === selectedId) ?? null)
      : null;
  });

  // Dismissal is presentation state only; the query remains the source of
  // truth for the underlying error and will expose it again on a new failure.
  const dismissedError = ref(false);
  const errorMessage = computed(() => {
    if (!isError.value || dismissedError.value) return null;
    return (
      queryError.value?.message ?? i18n.global.t('common.failedLoadDlqEntries')
    );
  });

  function dismissError(): void {
    dismissedError.value = true;
  }

  const actions = useDlqActions(guardedRefetch, {
    entries,
    selectedEntry,
    readState,
    dismissError,
  });

  watch(dlqData, (value) => {
    if (!value) return;
    onDataArrived();
    const selectedId = queryState.selectedEntryId.value;
    if (selectedId && !value.data.some((entry) => entry.id === selectedId)) {
      queryState.selectEntry(null);
    }
  });

  watch(isError, (failed) => {
    dismissedError.value = false;
    if (!failed) return;
    onError();
    if (queryError.value?.message) toast.debug(queryError.value.message);
    toast.error(i18n.global.t('common.failedLoadDlqEntries'));
  });

  watch(
    [
      queryState.filterStatus,
      queryState.filterSearch,
      queryState.offset,
      queryState.limit,
    ],
    () => {
      instantRefetch();
    },
  );

  return {
    entries,
    selectedEntry,
    total,
    currentPage,
    totalPages,
    errorMessage,
    loading,
    actions,
    readState,
  };
}
