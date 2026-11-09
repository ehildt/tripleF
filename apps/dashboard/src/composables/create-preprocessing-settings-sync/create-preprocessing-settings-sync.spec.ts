import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchConfig, saveConfig } from '@/api/config.api';
import { fetchSharpOverrides } from '@/api/fetch-sharp-overrides.api';
import { saveSharpOverrides } from '@/api/save-sharp-overrides.api';
import { usePreprocessingSettingsStore } from '@/stores/preprocessing-settings/preprocessing-settings.store';

import { createPreprocessingSettingsSync } from './create-preprocessing-settings-sync';

vi.mock('@/api/config.api', () => ({
  fetchConfig: vi.fn(),
  saveConfig: vi.fn(),
}));
vi.mock('@/api/fetch-sharp-overrides.api', () => ({
  fetchSharpOverrides: vi.fn(),
}));
vi.mock('@/api/save-sharp-overrides.api', () => ({
  saveSharpOverrides: vi.fn(),
}));

function deferred() {
  let resolve = () => {};
  const promise = new Promise<void>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

function createSync() {
  const store = usePreprocessingSettingsStore();
  const sync = createPreprocessingSettingsSync(store, 'session-1');
  return { store, sync };
}

describe('createPreprocessingSettingsSync', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setActivePinia(createPinia());
    vi.clearAllMocks();
    vi.mocked(fetchSharpOverrides).mockResolvedValue(null);
    vi.mocked(fetchConfig).mockResolvedValue(null);
    vi.mocked(saveSharpOverrides).mockResolvedValue(undefined);
    vi.mocked(saveConfig).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('loads once, applies per-field precedence, and never echoes hydration', async () => {
    vi.mocked(fetchSharpOverrides).mockResolvedValue({
      enabled: false,
      variants: { grayscale: true },
    });
    vi.mocked(fetchConfig).mockResolvedValue({
      sessionId: 'session-1',
      preprocessing: { enabled: true, resize: { maxWidth: 512 } },
    });
    const { store, sync } = createSync();

    expect(fetchSharpOverrides).not.toHaveBeenCalled();
    await Promise.all([sync.loadSettings(), sync.loadSettings()]);

    expect(fetchSharpOverrides).toHaveBeenCalledOnce();
    expect(fetchConfig).toHaveBeenCalledWith('session-1');
    expect(store.enabled).toBe(true);
    expect(store.resize.maxWidth).toBe(512);
    expect(store.variants.grayscale).toBe(true);
    expect(saveSharpOverrides).not.toHaveBeenCalled();
    expect(saveConfig).not.toHaveBeenCalled();
  });

  it('retains a valid session source when global loading fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(fetchSharpOverrides).mockRejectedValue(new Error('offline'));
    vi.mocked(fetchConfig).mockResolvedValue({
      sessionId: 'session-1',
      preprocessing: { enabled: false },
    });
    const { store, sync } = createSync();

    await sync.loadSettings();

    expect(store.enabled).toBe(false);
    expect(store.resize.maxWidth).toBe(768);
  });

  it('retains a valid global source when session loading fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(fetchSharpOverrides).mockResolvedValue({ enabled: false });
    vi.mocked(fetchConfig).mockRejectedValue(new Error('offline'));
    const { store, sync } = createSync();

    await sync.loadSettings();

    expect(store.enabled).toBe(false);
  });

  it('debounces and coalesces rapid edits into the latest snapshot', async () => {
    const { store, sync } = createSync();
    await sync.loadSettings();

    store.setEnabled(false);
    store.setVariant('grayscale', true);
    store.setParameter('blurSigma', 2);

    expect(saveSharpOverrides).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(249);
    expect(saveSharpOverrides).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);

    expect(saveSharpOverrides).toHaveBeenCalledOnce();
    expect(saveSharpOverrides).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false }),
    );
    expect(
      vi.mocked(saveSharpOverrides).mock.calls[0][0].variants.grayscale,
    ).toBe(true);
    expect(
      vi.mocked(saveSharpOverrides).mock.calls[0][0].parameters.blurSigma,
    ).toBe(2);
    expect(saveConfig).toHaveBeenCalledWith('session-1', {
      preprocessing: vi.mocked(saveSharpOverrides).mock.calls[0][0],
    });
  });

  it('persists continuous edits at maxWait even without a quiet period', async () => {
    const { store, sync } = createSync();
    await sync.loadSettings();

    store.setEnabled(false);
    for (const value of [0.6, 0.7, 0.8, 0.9]) {
      await vi.advanceTimersByTimeAsync(200);
      store.setParameter('blurSigma', value);
    }
    expect(saveSharpOverrides).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(200);

    expect(saveSharpOverrides).toHaveBeenCalledOnce();
    expect(
      vi.mocked(saveSharpOverrides).mock.calls[0][0].parameters.blurSigma,
    ).toBeCloseTo(0.9);
  });

  it('serializes snapshots so a later write cannot overtake an in-flight write', async () => {
    const firstSave = deferred();
    vi.mocked(saveSharpOverrides)
      .mockImplementationOnce(() => firstSave.promise)
      .mockResolvedValue(undefined);
    const { store, sync } = createSync();
    await sync.loadSettings();

    store.setMaxWidth(256);
    await vi.advanceTimersByTimeAsync(250);
    expect(saveSharpOverrides).toHaveBeenCalledOnce();

    store.setMaxWidth(1024);
    await vi.advanceTimersByTimeAsync(250);
    expect(saveSharpOverrides).toHaveBeenCalledOnce();

    firstSave.resolve();
    await vi.advanceTimersByTimeAsync(0);

    expect(saveSharpOverrides).toHaveBeenCalledTimes(2);
    expect(vi.mocked(saveSharpOverrides).mock.calls[1][0].resize.maxWidth).toBe(
      1024,
    );
  });

  it('flushes the latest pending edit immediately without a duplicate watcher save', async () => {
    const { store, sync } = createSync();
    await sync.loadSettings();
    store.setEnabled(false);

    await sync.flushSettings();

    expect(saveSharpOverrides).toHaveBeenCalledOnce();
    expect(vi.mocked(saveSharpOverrides).mock.calls[0][0].enabled).toBe(false);
    await vi.advanceTimersByTimeAsync(1000);
    expect(saveSharpOverrides).toHaveBeenCalledOnce();
  });

  it('does not finish flushing until the current global save settles', async () => {
    const currentSave = deferred();
    vi.mocked(saveSharpOverrides).mockImplementation(() => currentSave.promise);
    const { sync } = createSync();
    await sync.loadSettings();
    let flushed = false;

    const flushing = sync.flushSettings().then(() => {
      flushed = true;
    });
    await vi.advanceTimersByTimeAsync(0);
    expect(flushed).toBe(false);

    currentSave.resolve();
    await flushing;
    expect(flushed).toBe(true);
  });

  it('rejects an explicit flush when the controlling global save fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(saveSharpOverrides).mockRejectedValue(new Error('global failed'));
    const { sync } = createSync();
    await sync.loadSettings();

    await expect(sync.flushSettings()).rejects.toThrow('global failed');
  });

  it('allows an explicit flush when only session persistence fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(saveConfig).mockRejectedValue(new Error('session failed'));
    const { sync } = createSync();
    await sync.loadSettings();

    await expect(sync.flushSettings()).resolves.toBeUndefined();
    expect(saveSharpOverrides).toHaveBeenCalledOnce();
    expect(errorSpy).toHaveBeenCalledWith(
      'Failed to save session preprocessing settings',
      expect.any(Error),
    );
  });
});
