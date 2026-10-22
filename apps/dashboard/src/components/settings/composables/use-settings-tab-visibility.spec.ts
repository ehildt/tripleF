import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { useAppStore } from '@/stores/app/app.store';
import { useDebugStore } from '@/stores/debug/debug.store';

import { useSettingsTabVisibility } from './use-settings-tab-visibility';

describe('useSettingsTabVisibility', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('harness-tab-visibility', JSON.stringify({}));
    localStorage.setItem('harness-show-counters', 'true');
    setActivePinia(createPinia());
  });

  it('toggles a tab via the app store', () => {
    const appStore = useAppStore();
    const { toggleTab } = useSettingsTabVisibility();
    expect(appStore.isTabVisible('preprocessing')).toBe(true);
    toggleTab('preprocessing');
    expect(appStore.isTabVisible('preprocessing')).toBe(false);
    toggleTab('preprocessing');
    expect(appStore.isTabVisible('preprocessing')).toBe(true);
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
});
