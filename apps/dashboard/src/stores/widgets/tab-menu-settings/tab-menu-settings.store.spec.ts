import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useTabMenuSettingsStore } from './tab-menu-settings.store';

describe('useTabMenuSettingsStore', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('starts with the defaults', () => {
    const store = useTabMenuSettingsStore();
    expect(store.tabMenuSide).toBe('right');
    expect(store.tabMenuAutoClose).toBe(false);
  });

  it('hydrates the side from storage', () => {
    localStorage.setItem('vision-tab-menu-side', 'left');
    expect(useTabMenuSettingsStore().tabMenuSide).toBe('left');
  });

  it('ignores an invalid stored side', () => {
    localStorage.setItem('vision-tab-menu-side', 'diagonal');
    expect(useTabMenuSettingsStore().tabMenuSide).toBe('right');
  });

  it('persists the side', () => {
    const store = useTabMenuSettingsStore();
    store.setTabMenuSide('left');
    expect(store.tabMenuSide).toBe('left');
    expect(localStorage.getItem('vision-tab-menu-side')).toBe('left');
  });

  it('persists the autoclose flag', () => {
    const store = useTabMenuSettingsStore();
    store.setTabMenuAutoClose(true);
    expect(store.tabMenuAutoClose).toBe(true);
    expect(localStorage.getItem('vision-tab-menu-auto-close')).toBe('true');
  });

  it('uses defaults when storage reads are unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    const store = useTabMenuSettingsStore();

    expect(store.tabMenuSide).toBe('right');
    expect(store.tabMenuAutoClose).toBe(false);
  });

  it('keeps changes in memory when storage writes are unavailable', () => {
    const store = useTabMenuSettingsStore();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });

    expect(() => {
      store.setTabMenuSide('left');
      store.setTabMenuAutoClose(true);
    }).not.toThrow();
    expect(store.tabMenuSide).toBe('left');
    expect(store.tabMenuAutoClose).toBe(true);
  });

  it('resets both settings to their defaults', () => {
    const store = useTabMenuSettingsStore();
    store.setTabMenuSide('left');
    store.setTabMenuAutoClose(true);

    store.resetTabMenuSettings();

    expect(store.tabMenuSide).toBe('right');
    expect(store.tabMenuAutoClose).toBe(false);
  });
});
