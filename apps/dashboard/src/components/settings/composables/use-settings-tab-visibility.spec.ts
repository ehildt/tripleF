import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { useAppStore } from '../../../stores/app';
import { useDebugStore } from '../../../stores/debug';
import { useSettingsTabVisibility } from './use-settings-tab-visibility';

describe('useSettingsTabVisibility', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('harness-tab-visibility', JSON.stringify({}));
    localStorage.setItem('harness-show-counters', 'true');
    setActivePinia(createPinia());
  });

  it('reflects tab visibility from the app store', () => {
    const appStore = useAppStore();
    appStore.toggleTabVisibility('debug');

    const { isTabVisible } = useSettingsTabVisibility();
    // debug starts hidden; the toggle flips it to visible.
    expect(isTabVisible('debug')).toBe(true);
  });

  it('toggles a tab via the app store', () => {
    const { isTabVisible, toggleTab } = useSettingsTabVisibility();
    expect(isTabVisible('preprocessing')).toBe(true);
    toggleTab('preprocessing');
    expect(isTabVisible('preprocessing')).toBe(false);
  });

  it('pauses the debug log when the debug tab is hidden', () => {
    const debugStore = useDebugStore();
    const { toggleTab } = useSettingsTabVisibility();

    // Logging is off by default (paused) — debug starts hidden.
    expect(debugStore.debugPaused).toBe(true);
    toggleTab('debug');
    expect(debugStore.debugPaused).toBe(false);
    toggleTab('debug');
    expect(debugStore.debugPaused).toBe(true);
  });

  it('toggles counters visibility', () => {
    const { showCounters, toggleShowCounters } = useSettingsTabVisibility();
    expect(showCounters.value).toBe(true);
    toggleShowCounters();
    expect(showCounters.value).toBe(false);
    toggleShowCounters();
    expect(showCounters.value).toBe(true);
  });
});
