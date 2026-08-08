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
    expect(store.activeTab).toBe('chat');
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

  describe('scroll mode', () => {
    it('defaults to carousel', () => {
      const store = useAppStore();
      expect(store.defaultScrollMode).toBe('carousel');
    });

    it('setDefaultScrollMode updates the global default', () => {
      const store = useAppStore();
      store.setDefaultScrollMode('native');
      expect(store.defaultScrollMode).toBe('native');
    });

    it('conversations inherit the global default when not overridden', () => {
      const store = useAppStore();
      store.setDefaultScrollMode('native');
      expect(store.getConversationScrollMode('conv-1')).toBe('native');
    });

    it('setConversationScrollMode overrides the default for one conversation', () => {
      const store = useAppStore();
      store.setDefaultScrollMode('native');
      store.setConversationScrollMode('conv-1', 'carousel');
      expect(store.getConversationScrollMode('conv-1')).toBe('carousel');
      // Other conversations still inherit the default.
      expect(store.getConversationScrollMode('conv-2')).toBe('native');
    });
  });

  describe('media priority', () => {
    it('defaults to images', () => {
      const store = useAppStore();
      expect(store.defaultMediaPriority).toBe('images');
    });

    it('setDefaultMediaPriority updates the global default', () => {
      const store = useAppStore();
      store.setDefaultMediaPriority('videos');
      expect(store.defaultMediaPriority).toBe('videos');
    });

    it('conversations inherit the global default when not overridden', () => {
      const store = useAppStore();
      store.setDefaultMediaPriority('videos');
      expect(store.getConversationMediaPriority('conv-1')).toBe('videos');
    });

    it('setConversationMediaPriority overrides the default for one conversation', () => {
      const store = useAppStore();
      store.setDefaultMediaPriority('videos');
      store.setConversationMediaPriority('conv-1', 'images');
      expect(store.getConversationMediaPriority('conv-1')).toBe('images');
      // Other conversations still inherit the default.
      expect(store.getConversationMediaPriority('conv-2')).toBe('videos');
    });
  });

  describe('temporary retention', () => {
    it('defaults to 7 days (10080 minutes) when unset', () => {
      const store = useAppStore();
      expect(store.temporaryRetentionMinutes).toBe(10080);
    });

    it('setTemporaryRetentionMinutes clamps negative values to 0', () => {
      const store = useAppStore();
      store.setTemporaryRetentionMinutes(-5);
      expect(store.temporaryRetentionMinutes).toBe(0);
      store.setTemporaryRetentionMinutes(30);
      expect(store.temporaryRetentionMinutes).toBe(30);
    });
  });

  describe('chat icon visibility', () => {
    it('defaults every action icon to visible', () => {
      const store = useAppStore();
      expect(store.chatIconVisibility).toEqual({
        copy: true,
        include: true,
        branch: true,
        delete: true,
      });
    });

    it('setChatIconVisibility toggles a single icon', () => {
      const store = useAppStore();
      store.setChatIconVisibility('copy', false);
      expect(store.chatIconVisibility.copy).toBe(false);
      expect(store.chatIconVisibility.include).toBe(true);
    });
  });

  describe('chart config', () => {
    it('defaults to candles, heatmap flow, green colormap, and all annotations on', () => {
      const store = useAppStore();
      expect(store.chartConfig).toEqual({
        priceStyle: 'candles',
        volumeStyle: 'heatmap',
        heatmapVariant: 'flow',
        colormap: 'green',
        showMarkers: true,
        showReferenceLines: true,
        showTooltip: true,
      });
    });

    it('setChartConfig merges a partial patch', () => {
      const store = useAppStore();
      store.setChartConfig({ priceStyle: 'line', showTooltip: false });
      expect(store.chartConfig.priceStyle).toBe('line');
      expect(store.chartConfig.showTooltip).toBe(false);
      // Untouched fields keep their defaults.
      expect(store.chartConfig.volumeStyle).toBe('heatmap');
      expect(store.chartConfig.showMarkers).toBe(true);
    });
  });
});
