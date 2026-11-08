import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { usePromptMenuSettingsStore } from '@/stores/chat/prompt-menu-settings/prompt-menu-settings.store';

import { useSettingsMenuVisibility } from './use-settings-menu-visibility';

describe('useSettingsMenuVisibility', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it('toggles the source menu always-show state via the app store', () => {
    const promptMenuSettingsStore = usePromptMenuSettingsStore();
    const { toggleSourceMenuAlwaysShow } = useSettingsMenuVisibility();

    expect(promptMenuSettingsStore.sourceTagsMenuAlwaysShow.sources).toBe(true);
    toggleSourceMenuAlwaysShow();
    expect(promptMenuSettingsStore.sourceTagsMenuAlwaysShow.sources).toBe(
      false,
    );
  });

  it('toggles the view menu always-show state independently', () => {
    const promptMenuSettingsStore = usePromptMenuSettingsStore();
    const { toggleViewMenuAlwaysShow } = useSettingsMenuVisibility();

    toggleViewMenuAlwaysShow();
    expect(promptMenuSettingsStore.sourceTagsMenuAlwaysShow.view).toBe(false);
    expect(promptMenuSettingsStore.sourceTagsMenuAlwaysShow.sources).toBe(true);
  });
});
