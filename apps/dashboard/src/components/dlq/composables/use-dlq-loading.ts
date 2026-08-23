import { ref } from 'vue';

import type { DlqLoadingOptions } from './use-dlq-loading.types';

export function useDlqLoading(options: DlqLoadingOptions) {
  const { refetch, minLoadingMs = 3000 } = options;

  const showLoading = ref(false);
  let loadingTimer: ReturnType<typeof setTimeout> | null = null;
  let loadingStartedAt = 0;

  /**
   * Manual reload button: keep the spinner up for at least minLoadingMs so
   * the click feels acknowledged.
   */
  async function guardedRefetch() {
    if (loadingTimer) clearTimeout(loadingTimer);
    showLoading.value = true;
    loadingStartedAt = Date.now();
    await refetch();
    onDataArrived();
  }

  /**
   * Filter/pagination-driven refetch: no artificial minimum — the spinner
   * clears as soon as data arrives so typing never feels sluggish.
   */
  async function instantRefetch() {
    if (loadingTimer) clearTimeout(loadingTimer);
    showLoading.value = true;
    await refetch();
    showLoading.value = false;
  }

  function onDataArrived(): number | null {
    if (showLoading.value) {
      if (loadingTimer) clearTimeout(loadingTimer);
      const elapsed = Date.now() - loadingStartedAt;
      const remaining = minLoadingMs - elapsed;
      if (remaining > 0) {
        loadingTimer = setTimeout(() => {
          showLoading.value = false;
        }, remaining);
        return remaining;
      }
      showLoading.value = false;
    }
    return null;
  }

  function onError() {
    showLoading.value = false;
  }

  return {
    showLoading,
    guardedRefetch,
    instantRefetch,
    onDataArrived,
    onError,
  };
}
