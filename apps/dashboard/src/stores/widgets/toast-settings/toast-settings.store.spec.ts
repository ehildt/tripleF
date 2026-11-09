import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  TOAST_ANCHOR_STORAGE_KEY,
  TOAST_AUTO_HIDE_STORAGE_KEY,
  TOAST_DURATION_SECONDS_STORAGE_KEY,
  TOAST_ENABLED_STORAGE_KEY,
  TOAST_MUTED_MESSAGES_STORAGE_KEY,
  TOAST_PIN_ENABLED_STORAGE_KEY,
  TOAST_TYPE_FILTERS_STORAGE_KEY,
} from './toast-settings.constant';
import { useToastSettingsStore } from './toast-settings.store';

describe('useToastSettingsStore', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

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
    store.setToastDurationSeconds(Number.NaN);
    store.setToastDurationSeconds(Number.POSITIVE_INFINITY);
    store.setToastDurationSeconds(-1);
    expect(store.toastDurationSeconds).toBe(9);
  });

  it('persists the type filter', () => {
    const store = useToastSettingsStore();
    store.setToastTypeFilter('info', true);
    expect(store.toastTypeFilters.info).toBe(true);
    expect(store.toastTypeFilters.warning).toBe(true);
    expect(
      JSON.parse(localStorage.getItem('vision-toast-type-filters') ?? '{}'),
    ).toMatchObject({
      info: true,
      warning: true,
    });
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

  it('hydrates valid filters and muted entries while ignoring malformed fields', () => {
    localStorage.setItem(
      'vision-toast-type-filters',
      JSON.stringify({ info: true, warning: 'false', error: false }),
    );
    localStorage.setItem(
      'vision-toast-muted',
      JSON.stringify([
        { key: 'k-model', sample: 'Model warning' },
        { key: 42, sample: 'invalid' },
      ]),
    );

    const store = useToastSettingsStore();

    expect(store.toastTypeFilters.info).toBe(true);
    expect(store.toastTypeFilters.warning).toBe(true);
    expect(store.toastTypeFilters.error).toBe(false);
    expect(store.toastMutedMessages).toEqual([
      { key: 'k-model', sample: 'Model warning' },
    ]);
  });

  it('uses defaults for corrupt persisted JSON', () => {
    localStorage.setItem('vision-toast-type-filters', '{');
    localStorage.setItem('vision-toast-muted', '{');

    const store = useToastSettingsStore();

    expect(store.toastTypeFilters.info).toBe(false);
    expect(store.toastTypeFilters.warning).toBe(true);
    expect(store.toastMutedMessages).toEqual([]);
  });

  it('uses defaults when storage reads are unavailable', () => {
    vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    const store = useToastSettingsStore();

    expect(store.toastEnabled).toBe(true);
    expect(store.toastAnchor).toBe('bottom-right');
    expect(store.toastAutoHide).toBe(true);
    expect(store.toastDurationSeconds).toBe(3);
    expect(store.toastPinEnabled).toBe(true);
    expect(store.toastTypeFilters.warning).toBe(true);
    expect(store.toastMutedMessages).toEqual([]);
  });

  it('keeps changes in memory when storage writes are unavailable', () => {
    const store = useToastSettingsStore();
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });

    expect(() => {
      store.setToastEnabled(false);
      store.setToastAnchor('top-left');
      store.setToastAutoHide(false);
      store.setToastDurationSeconds(9);
      store.setToastPinEnabled(false);
      store.setToastTypeFilter('info', true);
      store.muteToastMessage('k-model', 'Model warning');
    }).not.toThrow();

    expect(store.toastEnabled).toBe(false);
    expect(store.toastAnchor).toBe('top-left');
    expect(store.toastDurationSeconds).toBe(9);
    expect(store.toastTypeFilters.info).toBe(true);
    expect(store.isToastMessageMuted('k-model')).toBe(true);
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
    const setItem = vi.spyOn(localStorage, 'setItem');

    store.resetToastSettings();

    expect(store.toastEnabled).toBe(true);
    expect(store.toastAnchor).toBe('bottom-right');
    expect(store.toastAutoHide).toBe(true);
    expect(store.toastDurationSeconds).toBe(3);
    expect(store.toastPinEnabled).toBe(true);
    expect(store.toastTypeFilters.info).toBe(false);
    expect(store.toastMutedMessages).toEqual([]);
    expect(setItem.mock.calls.map(([key]) => key)).toEqual([
      TOAST_ENABLED_STORAGE_KEY,
      TOAST_ANCHOR_STORAGE_KEY,
      TOAST_AUTO_HIDE_STORAGE_KEY,
      TOAST_DURATION_SECONDS_STORAGE_KEY,
      TOAST_PIN_ENABLED_STORAGE_KEY,
      TOAST_TYPE_FILTERS_STORAGE_KEY,
      TOAST_MUTED_MESSAGES_STORAGE_KEY,
    ]);
  });
});
