import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { useAppStore } from '@/stores/app/app.store';

import { useSettingsMenuVisibility } from './use-settings-menu-visibility';

describe('useSettingsMenuVisibility', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it('toggles the source menu always-show state via the app store', () => {
    const appStore = useAppStore();
    const { toggleSourceMenuAlwaysShow } = useSettingsMenuVisibility();

    expect(appStore.sourceTagsMenuAlwaysShow.sources).toBe(true);
    toggleSourceMenuAlwaysShow();
    expect(appStore.sourceTagsMenuAlwaysShow.sources).toBe(false);
  });

  it('toggles the view menu always-show state independently', () => {
    const appStore = useAppStore();
    const { toggleViewMenuAlwaysShow } = useSettingsMenuVisibility();

    toggleViewMenuAlwaysShow();
    expect(appStore.sourceTagsMenuAlwaysShow.view).toBe(false);
    expect(appStore.sourceTagsMenuAlwaysShow.sources).toBe(true);
  });
});
