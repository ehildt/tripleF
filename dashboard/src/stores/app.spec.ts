import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

import { useAppStore } from './app';

vi.mock('@vueuse/core', () => ({
  useClipboard: vi.fn().mockReturnValue({
    copy: vi.fn().mockResolvedValue(undefined),
    copied: ref(false),
    isSupported: ref(true),
  }),
  useTimeoutFn: vi
    .fn()
    .mockImplementation((callback: () => void, ms: number) => {
      let timer: ReturnType<typeof setTimeout> | null = null;
      return {
        start: () => {
          if (timer) clearTimeout(timer);
          timer = setTimeout(callback, ms);
        },
        stop: () => {
          if (timer) {
            clearTimeout(timer);
            timer = null;
          }
        },
      };
    }),
}));

describe('useAppStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.restoreAllMocks();
  });

  it('initializes with correct defaults', () => {
    const store = useAppStore();
    expect(store.activeTab).toBe('http');
    expect(store.copiedIndex).toBeNull();
    expect(store.abortingId).toBeNull();
  });

  it('handleCopyToClipboard sets copiedIndex and resets after timeout', async () => {
    vi.useFakeTimers();
    const store = useAppStore();
    await store.handleCopyToClipboard('hello', 3);
    expect(store.copiedIndex).toBe(3);

    vi.advanceTimersByTime(1500);
    await Promise.resolve();
    expect(store.copiedIndex).toBeNull();
    vi.useRealTimers();
  });

  it('refreshRequestId generates new id', () => {
    const store = useAppStore();
    const prev = store.requestId;
    store.refreshRequestId();
    expect(store.requestId).not.toBe(prev);
  });

  it('abortJob returns true on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      }),
    );
    const store = useAppStore();
    const result = await store.abortJob('req-1');
    expect(result).toBe(true);
    expect(store.abortingId).toBeNull();
  });

  it('abortJob returns false on non-ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue({ ok: false, text: () => Promise.resolve('err') }),
    );
    const store = useAppStore();
    const spyWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = await store.abortJob('req-2');
    expect(result).toBe(false);
    spyWarn.mockRestore();
  });

  it('abortJob returns false on exception', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('fail')));
    const store = useAppStore();
    const spyErr = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await store.abortJob('req-3');
    expect(result).toBe(false);
    spyErr.mockRestore();
  });
});
