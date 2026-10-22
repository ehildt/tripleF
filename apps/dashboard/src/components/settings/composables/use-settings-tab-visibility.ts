import { useAppStore } from '@/stores/app/app.store';
import { useDebugStore } from '@/stores/debug/debug.store';

/**
 * Tab-visibility toggles with side effects: hiding or showing the debug
 * tab also pauses/resumes the debug log. Plain reads (`isTabVisible`,
 * `showCounters`) have no added value here — consumers bind the app store
 * directly; this composable only owns the toggles that do real work.
 */
export function useSettingsTabVisibility() {
  const appStore = useAppStore();
  const debugStore = useDebugStore();

  function toggleTab(tab: string) {
    appStore.toggleTabVisibility(tab);
    if (tab === 'debug') {
      debugStore.debugPaused = appStore.isTabVisible('debug') ? false : true;
    }
  }

  return { toggleTab };
}
