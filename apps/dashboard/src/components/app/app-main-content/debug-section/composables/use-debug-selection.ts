import { computed, type ComputedRef, ref } from 'vue';

import { useDebugStore } from '@/stores/debug/debug.store';
import type { DebugResult } from '@/types/debug.model';

interface DebugSelection {
  selectedResult: ComputedRef<DebugResult | null>;
  selectDebugResult: (result: DebugResult | null) => void;
  clearDebugView: () => void;
}

/** Own DebugSection selection without duplicating a result record in Pinia. */
export function useDebugSelection(): DebugSelection {
  const debugStore = useDebugStore();
  const selectedResultId = ref<string | null>(null);

  const selectedResult = computed(() => {
    if (!selectedResultId.value) return null;
    return (
      debugStore.debugResults.find(
        (result) => result.id === selectedResultId.value,
      ) ?? null
    );
  });

  function selectDebugResult(result: DebugResult | null): void {
    selectedResultId.value = result?.id ?? null;
  }

  function clearDebugView(): void {
    debugStore.clearDebugResults();
    selectedResultId.value = null;
  }

  return { selectedResult, selectDebugResult, clearDebugView };
}
