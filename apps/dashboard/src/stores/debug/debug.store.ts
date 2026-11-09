import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';

import { useReadTracker } from '@/composables/use-read-tracker/use-read-tracker';
import type { DebugResult } from '@/types/debug.model';
import type { DebugResultInput } from '@/types/debug-result-input.model';
import { createId } from '@/utils/create-id/create-id.helper';
import { saveBooleanSetting } from '@/utils/save-boolean-setting/save-boolean-setting.helper';

import { parseDebugPaused } from './helpers/parse-debug-paused.helper';
import { DEBUG_PAUSED_STORAGE_KEY } from './debug.constant';

/** Shared debug entries, pause preference, and persisted read state. */
export const useDebugStore = defineStore('debug', () => {
  const debugResults = ref<DebugResult[]>([]);
  const readTracker = useReadTracker('read-debug-ids');
  const debugPaused = ref(true);
  try {
    debugPaused.value = parseDebugPaused(
      localStorage.getItem(DEBUG_PAUSED_STORAGE_KEY),
    );
  } catch {
    /* Storage unavailable: retain the paused default. */
  }

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
