import { usePromptMenuSettingsStore } from '@/stores/chat/prompt-menu-settings/prompt-menu-settings.store';

/**
 * Toggle actions for the prompt bar's floating icon menus (whether each
 * menu stays pinned open or collapses behind the expand arrow). The flags
 * persist through the prompt-menu settings store; read-side binds
 * `usePromptMenuSettingsStore().sourceTagsMenuAlwaysShow` directly.
 */
export function useSettingsMenuVisibility() {
  const promptMenuSettingsStore = usePromptMenuSettingsStore();

  function toggleSourceMenuAlwaysShow() {
    promptMenuSettingsStore.setSourceTagsMenuAlwaysShow(
      'sources',
      !promptMenuSettingsStore.sourceTagsMenuAlwaysShow.sources,
    );
  }

  function toggleViewMenuAlwaysShow() {
    promptMenuSettingsStore.setSourceTagsMenuAlwaysShow(
      'view',
      !promptMenuSettingsStore.sourceTagsMenuAlwaysShow.view,
    );
  }

  return { toggleSourceMenuAlwaysShow, toggleViewMenuAlwaysShow };
}
