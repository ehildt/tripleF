import { ref } from 'vue';

export interface DlqLoadingOptions {
  refetch: () => Promise<unknown>;
  minLoadingMs?: number;
}

export function useDlqLoading(options: DlqLoadingOptions) {
  const { refetch, minLoadingMs = 3000 } = options;

  const showLoading = ref(false);
  let loadingTimer: ReturnType<typeof setTimeout> | null = null;
  let loadingStartedAt = 0;

  async function guardedRefetch() {
    if (loadingTimer) clearTimeout(loadingTimer);
    showLoading.value = true;
    loadingStartedAt = Date.now();
    await refetch();
    onDataArrived();
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

  return { showLoading, guardedRefetch, onDataArrived, onError };
}
