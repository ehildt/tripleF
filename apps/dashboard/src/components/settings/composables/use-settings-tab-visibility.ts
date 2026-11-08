import { useNavigationStore } from '@/stores/app/navigation/navigation.store';
import { useDebugStore } from '@/stores/debug/debug.store';

/**
 * Tab-visibility toggles with side effects: hiding or showing the debug
 * tab also pauses/resumes the debug log. Plain reads (`isTabVisible`,
 * `showCounters`) have no added value here — consumers bind the navigation
 * store directly; this composable only owns the toggles that do real work.
 */
export function useSettingsTabVisibility() {
  const navigationStore = useNavigationStore();
  const debugStore = useDebugStore();

  function toggleTab(tab: string) {
    navigationStore.toggleTabVisibility(tab);
    if (tab === 'debug') {
      debugStore.debugPaused = navigationStore.isTabVisible('debug')
        ? false
        : true;
    }
  }

  return { toggleTab };
}
