import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { useTabMenuSettingsStore } from './tab-menu-settings.store';

describe('useTabMenuSettingsStore', () => {
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

  it('resets both settings to their defaults', () => {
    const store = useTabMenuSettingsStore();
    store.setTabMenuSide('left');
    store.setTabMenuAutoClose(true);

    store.resetTabMenuSettings();

    expect(store.tabMenuSide).toBe('right');
    expect(store.tabMenuAutoClose).toBe(false);
  });
});
