import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useNavigationStore } from './navigation.store';

describe('useNavigationStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('preserves tab visibility defaults and unknown-tab behavior', () => {
    const store = useNavigationStore();
    expect(store.isTabVisible('debug')).toBe(false);
    expect(store.isTabVisible('sockets')).toBe(false);
    expect(store.isTabVisible('dlq')).toBe(true);
    expect(store.isTabVisible('preprocessing')).toBe(true);

    store.toggleTabVisibility('debug');
    expect(store.isTabVisible('debug')).toBe(true);
  });

  it('defaults counters off and toggles them', () => {
    const store = useNavigationStore();
    expect(store.showCounters).toBe(false);
    store.toggleShowCounters();
    expect(store.showCounters).toBe(true);
  });

  it('retains the existing counters fallback when storage is unavailable', () => {
    vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
      throw new Error('storage unavailable');
    });
    expect(useNavigationStore().showCounters).toBe(true);
  });

  it('marks and clears chat response activity', () => {
    const store = useNavigationStore();
    expect(store.showChatStar).toBe(false);
    store.markChatResponseActivity();
    expect(store.showChatStar).toBe(true);
    store.clearChatResponseActivity();
    expect(store.showChatStar).toBe(false);
  });
});
