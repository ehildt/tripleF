import { computed } from 'vue';

import { useAppStore } from '../../../stores/app';
import { useDebugStore } from '../../../stores/debug';

export function useSysctlTabVisibility() {
  const appStore = useAppStore();
  const debugStore = useDebugStore();

  function isTabVisible(tab: string): boolean {
    return appStore.isTabVisible(tab);
  }

  function toggleTab(tab: string) {
    appStore.toggleTabVisibility(tab);
    if (tab === 'debug') {
      debugStore.debugPaused = appStore.isTabVisible('debug') ? false : true;
    }
  }

  function toggleShowCounters() {
    appStore.toggleShowCounters();
  }

  return {
    isTabVisible,
    toggleTab,
    showCounters: computed(() => appStore.showCounters),
    toggleShowCounters,
  };
}
