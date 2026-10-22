import { useAppStore } from '@/stores/app/app.store';

/**
 * Toggle actions for the prompt bar's floating icon menus (whether each
 * menu stays pinned open or collapses behind the expand arrow). The flags
 * persist through the app store; read-side binds
 * `useAppStore().sourceTagsMenuAlwaysShow` directly.
 */
export function useSettingsMenuVisibility() {
  const appStore = useAppStore();

  function toggleSourceMenuAlwaysShow() {
    appStore.setSourceTagsMenuAlwaysShow(
      'sources',
      !appStore.sourceTagsMenuAlwaysShow.sources,
    );
  }

  function toggleViewMenuAlwaysShow() {
    appStore.setSourceTagsMenuAlwaysShow(
      'view',
      !appStore.sourceTagsMenuAlwaysShow.view,
    );
  }

  return { toggleSourceMenuAlwaysShow, toggleViewMenuAlwaysShow };
}
