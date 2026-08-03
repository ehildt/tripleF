import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { useAppStore } from '../../../stores/app';
import { useDebugStore } from '../../../stores/debug';
import { useSysctlTabVisibility } from './use-sysctl-tab-visibility';

describe('useSysctlTabVisibility', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('harness-tab-visibility', JSON.stringify({}));
    localStorage.setItem('harness-show-counters', 'true');
    setActivePinia(createPinia());
  });

  it('reflects tab visibility from the app store', () => {
    const appStore = useAppStore();
    appStore.toggleTabVisibility('debug');

    const { isTabVisible } = useSysctlTabVisibility();
    expect(isTabVisible('debug')).toBe(false);
  });

  it('toggles a tab via the app store', () => {
    const { isTabVisible, toggleTab } = useSysctlTabVisibility();
    expect(isTabVisible('preprocessing')).toBe(true);
    toggleTab('preprocessing');
    expect(isTabVisible('preprocessing')).toBe(false);
  });

  it('pauses the debug log when the debug tab is hidden', () => {
    const debugStore = useDebugStore();
    const { toggleTab } = useSysctlTabVisibility();

    // Logging is off by default (paused).
    expect(debugStore.debugPaused).toBe(true);
    toggleTab('debug');
    expect(debugStore.debugPaused).toBe(true);
    toggleTab('debug');
    expect(debugStore.debugPaused).toBe(false);
  });

  it('toggles counters visibility', () => {
    const { showCounters, toggleShowCounters } = useSysctlTabVisibility();
    expect(showCounters.value).toBe(true);
    toggleShowCounters();
    expect(showCounters.value).toBe(false);
    toggleShowCounters();
    expect(showCounters.value).toBe(true);
  });
});
