import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { useAppStore } from '../../../stores/app';
import { useSettingsMenuVisibility } from './use-settings-menu-visibility';

describe('useSettingsMenuVisibility', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it('defaults both prompt-bar menus to always show', () => {
    const { sourceMenuAlwaysShow, viewMenuAlwaysShow } =
      useSettingsMenuVisibility();
    expect(sourceMenuAlwaysShow.value).toBe(true);
    expect(viewMenuAlwaysShow.value).toBe(true);
  });

  it('toggles the source menu always-show state via the app store', () => {
    const appStore = useAppStore();
    const { sourceMenuAlwaysShow, toggleSourceMenuAlwaysShow } =
      useSettingsMenuVisibility();

    toggleSourceMenuAlwaysShow();
    expect(sourceMenuAlwaysShow.value).toBe(false);
    expect(appStore.sourceTagsMenuAlwaysShow.sources).toBe(false);
  });

  it('toggles the view menu always-show state independently', () => {
    const appStore = useAppStore();
    const { viewMenuAlwaysShow, toggleViewMenuAlwaysShow } =
      useSettingsMenuVisibility();

    toggleViewMenuAlwaysShow();
    expect(viewMenuAlwaysShow.value).toBe(false);
    expect(appStore.sourceTagsMenuAlwaysShow.view).toBe(false);
    expect(appStore.sourceTagsMenuAlwaysShow.sources).toBe(true);
  });
});
