import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

import {
  DEFAULT_TAB_VISIBILITY,
  SHOW_COUNTERS_KEY,
  STAR_KEY,
  TAB_VISIBILITY_KEY,
} from './navigation.constant';

function loadStar(): boolean {
  try {
    return localStorage.getItem(STAR_KEY) === 'true';
  } catch {
    return false;
  }
}

function saveStar(value: boolean): void {
  try {
    localStorage.setItem(STAR_KEY, String(value));
  } catch {
    /* ignore */
  }
}

function loadTabVisibility(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(TAB_VISIBILITY_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveTabVisibility(value: Record<string, boolean>): void {
  try {
    localStorage.setItem(TAB_VISIBILITY_KEY, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

function loadShowCounters(): boolean {
  try {
    return localStorage.getItem(SHOW_COUNTERS_KEY) === 'true';
  } catch {
    return true;
  }
}

function saveShowCounters(value: boolean): void {
  try {
    localStorage.setItem(SHOW_COUNTERS_KEY, String(value));
  } catch {
    /* ignore */
  }
}

export const useNavigationStore = defineStore('navigation', () => {
  const showChatStar = ref(loadStar());
  const tabVisibility = ref<Record<string, boolean>>(loadTabVisibility());
  const showCounters = ref(loadShowCounters());

  watch(tabVisibility, saveTabVisibility, { deep: true });
  watch(showChatStar, saveStar);
  watch(showCounters, saveShowCounters);

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
