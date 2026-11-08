import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';

import { useReadTracker } from '@/composables/use-read-tracker/use-read-tracker';
import type { DebugResult } from '@/types/debug.model';
import type { DebugResultInput } from '@/types/debug-result-input.model';
import { createId } from '@/utils/create-id/create-id.helper';
import { saveBooleanSetting } from '@/utils/save-boolean-setting/save-boolean-setting.helper';

const DEBUG_PAUSED_STORAGE_KEY = 'debug-paused';

/** Logging is paused unless the persisted value is explicitly false. */
function loadDebugPaused(): boolean {
  try {
    return localStorage.getItem(DEBUG_PAUSED_STORAGE_KEY) !== 'false';
  } catch {
    return true;
  }
}

/** Shared debug entries, pause preference, and persisted read state. */
export const useDebugStore = defineStore('debug', () => {
  const debugResults = ref<DebugResult[]>([]);
  const readTracker = useReadTracker('read-debug-ids');
  const debugPaused = ref(loadDebugPaused());

  watch(debugPaused, (paused) => {
    saveBooleanSetting(DEBUG_PAUSED_STORAGE_KEY, paused);
  });

  const debugLogCount = computed(() => {
    const liveIds = debugResults.value.map((result) => result.id);
    return readTracker.unreadCount(liveIds);
  });

  function addDebugResult(result: DebugResultInput): void {
    if (debugPaused.value) return;
    debugResults.value.unshift({
      id: createId(),
      direction: 'request',
      ...result,
      epoch: Date.now(),
    });
  }

  function clearDebugResults(): void {
    debugResults.value = [];
  }

  function toggleDebugPaused(): void {
    debugPaused.value = !debugPaused.value;
  }

  function markDebugAsRead(id: string): void {
    readTracker.markAsRead(id);
  }

  function isDebugRead(id: string): boolean {
    return readTracker.isRead(id);
  }

  return {
    debugResults,
    debugLogCount,
    debugPaused,
    toggleDebugPaused,
    addDebugResult,
    clearDebugResults,
    markDebugAsRead,
    isDebugRead,
  };
});
