import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

import { loadBooleanSetting } from '@/utils/load-boolean-setting/load-boolean-setting.helper';
import { saveBooleanSetting } from '@/utils/save-boolean-setting/save-boolean-setting.helper';

import { parseShowCounters } from './helpers/parse-show-counters.helper';
import { parseTabVisibility } from './helpers/parse-tab-visibility.helper';
import {
  DEFAULT_TAB_VISIBILITY,
  SHOW_COUNTERS_KEY,
  STAR_KEY,
  TAB_VISIBILITY_KEY,
} from './navigation.constant';

export const useNavigationStore = defineStore('navigation', () => {
  const showChatStar = ref(loadBooleanSetting(STAR_KEY, false));
  const tabVisibility = ref<Record<string, boolean>>({});
  try {
    tabVisibility.value = parseTabVisibility(
      localStorage.getItem(TAB_VISIBILITY_KEY),
    );
  } catch {
    /* Storage unavailable: retain the default visibility rules. */
  }

  const showCounters = ref(false);
  try {
    showCounters.value = parseShowCounters(
      localStorage.getItem(SHOW_COUNTERS_KEY),
    );
  } catch {
    // Preserve the established exception-path fallback, distinct from the
    // missing-key default of false.
    showCounters.value = true;
  }

  watch(
    tabVisibility,
    (value) => {
      try {
        localStorage.setItem(TAB_VISIBILITY_KEY, JSON.stringify(value));
      } catch {
        /* Storage unavailable: retain visibility in memory. */
      }
    },
    { deep: true },
  );
  watch(showChatStar, (value) => saveBooleanSetting(STAR_KEY, value));
  watch(showCounters, (value) => saveBooleanSetting(SHOW_COUNTERS_KEY, value));

  function isTabVisible(tab: string): boolean {
    return tabVisibility.value[tab] ?? DEFAULT_TAB_VISIBILITY[tab] ?? true;
  }

  function toggleTabVisibility(tab: string): void {
    tabVisibility.value[tab] = !isTabVisible(tab);
  }

  function toggleShowCounters(): void {
    showCounters.value = !showCounters.value;
  }

  function markChatResponseActivity(): void {
    showChatStar.value = true;
  }

  function clearChatResponseActivity(): void {
    showChatStar.value = false;
  }

  return {
    showChatStar,
    tabVisibility,
    showCounters,
    isTabVisible,
    toggleTabVisibility,
    toggleShowCounters,
    markChatResponseActivity,
    clearChatResponseActivity,
  };
});
