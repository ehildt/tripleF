import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { useToastSettingsStore } from './toast-settings.store';

describe('useToastSettingsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('starts with the defaults', () => {
    const store = useToastSettingsStore();
    expect(store.toastEnabled).toBe(true);
    expect(store.toastAnchor).toBe('bottom-right');
    expect(store.toastAutoHide).toBe(true);
    expect(store.toastDurationSeconds).toBe(3);
    expect(store.toastPinEnabled).toBe(true);
    expect(store.toastTypeFilters).toEqual({
      info: false,
      success: false,
      warning: true,
      error: true,
      debug: false,
      default: false,
    });
    expect(store.toastMutedMessages).toEqual([]);
  });

  it('hydrates the duration from storage', () => {
    localStorage.setItem('vision-toast-duration-seconds', '7');
    expect(useToastSettingsStore().toastDurationSeconds).toBe(7);
  });

  it('rejects a stored duration that is not positive', () => {
    localStorage.setItem('vision-toast-duration-seconds', '0');
    expect(useToastSettingsStore().toastDurationSeconds).toBe(3);
  });

  it('persists the duration and ignores invalid updates', () => {
    const store = useToastSettingsStore();
    store.setToastDurationSeconds(9);
    expect(store.toastDurationSeconds).toBe(9);
    expect(localStorage.getItem('vision-toast-duration-seconds')).toBe('9');

    store.setToastDurationSeconds(0);
    expect(store.toastDurationSeconds).toBe(9);
  });

  it('persists the type filter', () => {
    const store = useToastSettingsStore();
    store.setToastTypeFilter('info', true);
    expect(store.toastTypeFilters.info).toBe(true);
    expect(store.toastTypeFilters.warning).toBe(true);
  });

  it('mutes and unmutes message kinds', () => {
    const store = useToastSettingsStore();
    store.muteToastMessage('k-model-vision', 'sample');
    expect(store.isToastMessageMuted('k-model-vision')).toBe(true);

    // Duplicate mutes are ignored.
    store.muteToastMessage('k-model-vision', 'again');
    expect(store.toastMutedMessages).toHaveLength(1);

    store.unmuteToastMessage('k-model-vision');
    expect(store.isToastMessageMuted('k-model-vision')).toBe(false);
  });

  it('resets everything back to defaults', () => {
    const store = useToastSettingsStore();
    store.setToastEnabled(false);
    store.setToastAnchor('top-left');
    store.setToastAutoHide(false);
    store.setToastDurationSeconds(9);
    store.setToastPinEnabled(false);
    store.setToastTypeFilter('info', true);
    store.muteToastMessage('k-x', 'sample');

    store.resetToastSettings();

    expect(store.toastEnabled).toBe(true);
    expect(store.toastAnchor).toBe('bottom-right');
    expect(store.toastAutoHide).toBe(true);
    expect(store.toastDurationSeconds).toBe(3);
    expect(store.toastPinEnabled).toBe(true);
    expect(store.toastTypeFilters.info).toBe(false);
    expect(store.toastMutedMessages).toEqual([]);
  });
});
