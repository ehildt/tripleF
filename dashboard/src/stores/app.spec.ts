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
    localStorage.clear();
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

  describe('source tags menu collapse', () => {
    it('defaults both menus to expanded', () => {
      const store = useAppStore();
      expect(store.sourceTagsMenuCollapsed).toEqual({
        sources: false,
        view: false,
      });
    });

    it('setSourceTagsMenuCollapsed toggles a single menu', () => {
      const store = useAppStore();
      store.setSourceTagsMenuCollapsed('sources', true);
      expect(store.sourceTagsMenuCollapsed.sources).toBe(true);
      expect(store.sourceTagsMenuCollapsed.view).toBe(false);

      store.setSourceTagsMenuCollapsed('view', true);
      expect(store.sourceTagsMenuCollapsed.view).toBe(true);
    });
  });

  describe('per-conversation source tags menu collapse', () => {
    it('falls back to the global default without an override', () => {
      const store = useAppStore();
      store.setSourceTagsMenuCollapsed('sources', true);
      expect(store.getSourceMenuCollapsed('conv-1', 'sources')).toBe(true);
    });

    it('overrides one conversation without leaking to others', () => {
      const store = useAppStore();
      store.setSourceMenuCollapsed('conv-1', 'sources', true);
      expect(store.getSourceMenuCollapsed('conv-1', 'sources')).toBe(true);
      expect(store.getSourceMenuCollapsed('conv-2', 'sources')).toBe(false);
      // Only the toggled menu is overridden.
      expect(store.getSourceMenuCollapsed('conv-1', 'view')).toBe(false);
    });
  });

  describe('source tags menu always show', () => {
    it('defaults both menus to always show', () => {
      const store = useAppStore();
      expect(store.sourceTagsMenuAlwaysShow).toEqual({
        sources: true,
        view: true,
      });
    });

    it('setSourceTagsMenuAlwaysShow toggles a single menu', () => {
      const store = useAppStore();
      store.setSourceTagsMenuAlwaysShow('sources', false);
      expect(store.sourceTagsMenuAlwaysShow.sources).toBe(false);
      expect(store.sourceTagsMenuAlwaysShow.view).toBe(true);

      store.setSourceTagsMenuAlwaysShow('view', false);
      expect(store.sourceTagsMenuAlwaysShow.view).toBe(false);
    });
  });

  describe('per-conversation source tags menu always show', () => {
    it('falls back to the global default without an override', () => {
      const store = useAppStore();
      store.setSourceTagsMenuAlwaysShow('sources', false);
      expect(store.getSourceMenuAlwaysShow('conv-1', 'sources')).toBe(false);
    });

    it('overrides one conversation without leaking to others', () => {
      const store = useAppStore();
      store.setSourceMenuAlwaysShow('conv-1', 'view', false);
      expect(store.getSourceMenuAlwaysShow('conv-1', 'view')).toBe(false);
      expect(store.getSourceMenuAlwaysShow('conv-2', 'view')).toBe(true);
      expect(store.getSourceMenuAlwaysShow('conv-1', 'sources')).toBe(true);
    });
  });

  describe('collapsed sections', () => {
    it('defaults every section type to expanded', () => {
      const store = useAppStore();
      expect(store.collapsedSections).toEqual({
        sources: false,
        keyFindings: false,
        internationalCoverage: false,
      });
    });

    it('setSectionCollapsed sets a single section type', () => {
      const store = useAppStore();
      store.setSectionCollapsed('sources', true);
      expect(store.collapsedSections.sources).toBe(true);
      expect(store.collapsedSections.keyFindings).toBe(false);
    });

    it('toggleSectionCollapsed flips one section type', () => {
      const store = useAppStore();
      store.toggleSectionCollapsed('sources');
      expect(store.collapsedSections.sources).toBe(true);
      expect(store.collapsedSections.keyFindings).toBe(false);
      store.toggleSectionCollapsed('sources');
      expect(store.collapsedSections.sources).toBe(false);
    });
  });

  describe('media presentations', () => {
    it('defaults to image gallery and video list', () => {
      const store = useAppStore();
      expect(store.mediaPresentations).toEqual({
        image: 'gallery',
        video: 'list',
      });
    });

    it('setMediaPresentation sets a single media type', () => {
      const store = useAppStore();
      store.setMediaPresentation('video', 'gallery');
      expect(store.mediaPresentations.video).toBe('gallery');
      expect(store.mediaPresentations.image).toBe('gallery');
    });

    it('toggleMediaPresentation flips one media type', () => {
      const store = useAppStore();
      store.toggleMediaPresentation('image');
      expect(store.mediaPresentations.image).toBe('list');
      expect(store.mediaPresentations.video).toBe('list');
      store.toggleMediaPresentation('image');
      expect(store.mediaPresentations.image).toBe('gallery');
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

  describe('memory cognition space history', () => {
    beforeEach(() => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
    });

    it('starts empty and records every non-empty setMemoryCognition', () => {
      const store = useAppStore();
      expect(store.memoryCognitionSpaces).toEqual([]);

      store.setMemoryCognition('alice');
      store.setMemoryCognition('work');
      expect(store.memoryCognitionSpaces).toEqual(['work', 'alice']);
    });

    it('trims, ignores empty values, and dedupes most-recent-first', () => {
      const store = useAppStore();
      store.setMemoryCognition('  alice  ');
      store.setMemoryCognition('');
      store.setMemoryCognition('work');
      store.setMemoryCognition('alice');
      expect(store.memoryCognitionSpaces).toEqual(['alice', 'work']);
    });

    it('caps the history at 20 entries', () => {
      const store = useAppStore();
      for (let i = 0; i < 25; i++) store.setMemoryCognition(`space-${i}`);
      expect(store.memoryCognitionSpaces).toHaveLength(20);
      expect(store.memoryCognitionSpaces[0]).toBe('space-24');
    });

    it('persists to and reloads from localStorage', async () => {
      const store = useAppStore();
      store.setMemoryCognition('alice');
      await new Promise((r) => setTimeout(r, 10));
      expect(localStorage.getItem('harness-memory-cognition-spaces')).toBe(
        JSON.stringify(['alice']),
      );

      // A fresh pinia re-runs the setup store and loads the persisted list.
      setActivePinia(createPinia());
      const reloaded = useAppStore();
      expect(reloaded.memoryCognitionSpaces).toEqual(['alice']);
    });

    it('drops malformed persisted history entries', () => {
      localStorage.setItem(
        'harness-memory-cognition-spaces',
        JSON.stringify(['alice', 42, '  ', { id: 'x' }, 'work']),
      );
      const store = useAppStore();
      expect(store.memoryCognitionSpaces).toEqual(['alice', 'work']);
    });

    it('removeMemoryCognitionSpace drops the entry and clears an active match', async () => {
      const store = useAppStore();
      store.setMemoryCognition('alice');
      store.setMemoryCognition('work');

      store.removeMemoryCognitionSpace('work');
      expect(store.memoryCognitionSpaces).toEqual(['alice']);
      expect(store.memoryCognition).toBe('');

      store.removeMemoryCognitionSpace('alice');
      expect(store.memoryCognitionSpaces).toEqual([]);
      await new Promise((r) => setTimeout(r, 10));
      expect(
        localStorage.getItem('harness-memory-cognition-spaces'),
      ).toBeNull();
    });

    it('removeMemoryCognitionSpace keeps a different active space', () => {
      const store = useAppStore();
      store.setMemoryCognition('alice');
      store.setMemoryCognition('work');

      store.removeMemoryCognitionSpace('alice');
      expect(store.memoryCognitionSpaces).toEqual(['work']);
      expect(store.memoryCognition).toBe('work');
    });
  });
});
