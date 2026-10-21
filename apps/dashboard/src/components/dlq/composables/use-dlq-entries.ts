import { onMounted, watch } from 'vue';

import { i18n } from '@/i18n/i18n';
import { useDlqStore } from '@/stores/dlq';

import { useDlqQuery } from '../../../api/queries/use-dlq-query';
import { useToast } from '../../../composables/use-toast';
import { useDlqActions } from './use-dlq-actions';
import { useDlqLoading } from './use-dlq-loading';

/**
 * Data lifecycle of the DLQ view: owns the entries query, the loading
 * spinner state, and the store sync (incoming data, errors, filter-driven
 * refetches). Row/detail actions are composed here because they must share
 * this query's guarded refetch; they are exposed under one `actions` key so
 * the orchestrator can bind them without recreating a second query instance.
 */
export function useDlqEntries() {
  const dlqStore = useDlqStore();
  const toast = useToast();

  // Opening the DLQ tab clears the activity dot — the list loads on open as
  // before, so the user has now "seen" the latest state.
  onMounted(() => dlqStore.clearDlqActivity());

  const {
    data: dlqData,
    error,
    isError,
    refetch,
  } = useDlqQuery(() => dlqStore.getQueryParams());

  const {
    showLoading,
    guardedRefetch,
    instantRefetch,
    onDataArrived,
    onError,
  } = useDlqLoading({ refetch });

  const actions = useDlqActions(guardedRefetch);

  watch(dlqData, (val) => {
    if (val) {
      dlqStore.setEntries(val);
      onDataArrived();
    }
  });

  watch(isError, (val) => {
    if (val) {
      onError();
      if (error.value?.message) toast.debug(error.value.message);
      dlqStore.error =
        error.value?.message ?? i18n.global.t('common.failedLoadDlqEntries');
      toast.error(i18n.global.t('common.failedLoadDlqEntries'));
    } else {
      dlqStore.error = null;
    }
  });

  watch(
    [
      () => dlqStore.filterStatus,
      () => dlqStore.filterSearch,
      () => dlqStore.offset,
      () => dlqStore.limit,
    ],
    () => {
      instantRefetch();
    },
  );

  // Bulk DLQ mutations (cleanup sweep, batch reinstate) ask for a single
  // refetch instead of carrying per-row payloads.
  watch(
    () => dlqStore.entriesRefreshNonce,
    () => {
      instantRefetch();
    },
  );

  return { showLoading, guardedRefetch, actions };
}
