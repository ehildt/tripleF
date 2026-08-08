import { useClipboard, useTimeoutFn } from '@vueuse/core';
import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

import { getApiUrl } from '@/api/api-url';
import { i18n } from '@/i18n/i18n';

import { useToast } from '../composables/use-toast';
import type {
  ActiveTab,
  ChartConfig,
  ChatIconKey,
  ChatIconVisibility,
  ScrollMode,
} from '../types/app.model';
import type { MediaPriority } from '../types/harness-response-data.model';
import { createId } from '../utils/id.helper';

const DEFAULT_CHAT_ICON_VISIBILITY: ChatIconVisibility = {
  copy: true,
  include: true,
  branch: true,
  delete: true,
};

const DEFAULT_CHART_CONFIG: ChartConfig = {
  priceStyle: 'candles',
  volumeStyle: 'heatmap',
  heatmapVariant: 'flow',
  colormap: 'green',
  showMarkers: true,
  showReferenceLines: true,
  showTooltip: true,
};

const STAR_KEY = 'harness-chat-star';

function loadStar(): boolean {
  try {
    return localStorage.getItem(STAR_KEY) === 'true';
  } catch {
    return false;
  }
}

function saveStar(value: boolean) {
  try {
    localStorage.setItem(STAR_KEY, String(value));
  } catch {
    /* ignore */
  }
}

export const useAppStore = defineStore('app', () => {
  const activeTab = ref<ActiveTab>('chat');

  function setActiveTab(tab: ActiveTab) {
    activeTab.value = tab;
  }
  const abortingId = ref<string | null>(null);
  const { copy } = useClipboard({ legacy: true });
  const copiedIndex = ref<number | null>(null);
  const { start: startCopiedIndexReset } = useTimeoutFn(
    () => {
      copiedIndex.value = null;
    },
    1500,
    { immediate: false },
  );
  const showChatStar = ref(loadStar());

  const VIS_KEY = 'harness-tab-visibility';
  /**
   * Tabs hidden unless explicitly enabled: dlq and debug start disabled by
   * default, so the user opts in via SysCtl. `http`/`sysctl` are core.
   */
  const DEFAULT_TAB_VISIBILITY: Record<string, boolean> = {
    chat: true,
    dlq: false,
    debug: false,
    sysctl: true,
  };
  function loadTabVisibility(): Record<string, boolean> {
    try {
      return JSON.parse(localStorage.getItem(VIS_KEY) || '{}');
    } catch {
      return {};
    }
  }
  function saveTabVisibility(v: Record<string, boolean>) {
    try {
      localStorage.setItem(VIS_KEY, JSON.stringify(v));
    } catch {
      /* ignore */
    }
  }
  const tabVisibility = ref<Record<string, boolean>>(loadTabVisibility());

  watch(tabVisibility, saveTabVisibility, { deep: true });

  function isTabVisible(tab: string): boolean {
    return tabVisibility.value[tab] ?? DEFAULT_TAB_VISIBILITY[tab] ?? true;
  }

  function toggleTabVisibility(tab: string) {
    tabVisibility.value[tab] =
      tabVisibility.value[tab] === false ? true : false;
  }

  const SCROLL_MODE_KEY = 'harness-scroll-mode';
  function loadScrollMode(): ScrollMode {
    try {
      const saved = localStorage.getItem(SCROLL_MODE_KEY);
      return saved === 'native' ? 'native' : 'carousel';
    } catch {
      return 'carousel';
    }
  }
  function saveScrollMode(v: ScrollMode) {
    try {
      localStorage.setItem(SCROLL_MODE_KEY, v);
    } catch {
      /* ignore */
    }
  }
  /** Global default every conversation inherits unless overridden. */
  const defaultScrollMode = ref<ScrollMode>(loadScrollMode());
  watch(defaultScrollMode, saveScrollMode);

  const CONV_SCROLL_MODE_KEY = 'harness-conv-scroll-mode';
  function loadConversationScrollModes(): Record<string, ScrollMode> {
    try {
      return JSON.parse(localStorage.getItem(CONV_SCROLL_MODE_KEY) || '{}');
    } catch {
      return {};
    }
  }
  function saveConversationScrollModes(v: Record<string, ScrollMode>) {
    try {
      localStorage.setItem(CONV_SCROLL_MODE_KEY, JSON.stringify(v));
    } catch {
      /* ignore */
    }
  }
  /** Per-conversation overrides keyed by conversation id. */
  const conversationScrollModes = ref<Record<string, ScrollMode>>(
    loadConversationScrollModes(),
  );
  watch(conversationScrollModes, saveConversationScrollModes, { deep: true });

  function setDefaultScrollMode(mode: ScrollMode) {
    defaultScrollMode.value = mode;
  }

  function getConversationScrollMode(conversationId: string): ScrollMode {
    return (
      conversationScrollModes.value[conversationId] ?? defaultScrollMode.value
    );
  }

  function setConversationScrollMode(conversationId: string, mode: ScrollMode) {
    conversationScrollModes.value[conversationId] = mode;
  }

  const MEDIA_PRIORITY_KEY = 'harness-media-priority';
  function loadMediaPriority(): MediaPriority {
    try {
      const saved = localStorage.getItem(MEDIA_PRIORITY_KEY);
      return saved === 'videos' ? 'videos' : 'images';
    } catch {
      return 'images';
    }
  }
  function saveMediaPriority(v: MediaPriority) {
    try {
      localStorage.setItem(MEDIA_PRIORITY_KEY, v);
    } catch {
      /* ignore */
    }
  }
  /** Global default every conversation inherits unless overridden. */
  const defaultMediaPriority = ref<MediaPriority>(loadMediaPriority());
  watch(defaultMediaPriority, saveMediaPriority);

  const CONV_MEDIA_PRIORITY_KEY = 'harness-conv-media-priority';
  function loadConversationMediaPriorities(): Record<string, MediaPriority> {
    try {
      return JSON.parse(localStorage.getItem(CONV_MEDIA_PRIORITY_KEY) || '{}');
    } catch {
      return {};
    }
  }
  function saveConversationMediaPriorities(v: Record<string, MediaPriority>) {
    try {
      localStorage.setItem(CONV_MEDIA_PRIORITY_KEY, JSON.stringify(v));
    } catch {
      /* ignore */
    }
  }
  /** Per-conversation overrides keyed by conversation id. */
  const conversationMediaPriorities = ref<Record<string, MediaPriority>>(
    loadConversationMediaPriorities(),
  );
  watch(conversationMediaPriorities, saveConversationMediaPriorities, {
    deep: true,
  });

  function setDefaultMediaPriority(priority: MediaPriority) {
    defaultMediaPriority.value = priority;
  }

  function getConversationMediaPriority(conversationId: string): MediaPriority {
    return (
      conversationMediaPriorities.value[conversationId] ??
      defaultMediaPriority.value
    );
  }

  function setConversationMediaPriority(
    conversationId: string,
    priority: MediaPriority,
  ) {
    conversationMediaPriorities.value[conversationId] = priority;
  }

  const TEMP_RETENTION_KEY = 'harness-temp-retention-minutes';
  /** Default retention for temporary conversations: 7 days. */
  const DEFAULT_TEMP_RETENTION_MINUTES = 7 * 24 * 60;
  function loadTempRetentionMinutes(): number {
    try {
      const raw = localStorage.getItem(TEMP_RETENTION_KEY);
      // `Number(null)` is 0 — treat an absent key as unset and use the default.
      if (raw === null) return DEFAULT_TEMP_RETENTION_MINUTES;
      const value = Number(raw);
      if (Number.isFinite(value) && value >= 0) return value;
    } catch {
      /* ignore */
    }
    return DEFAULT_TEMP_RETENTION_MINUTES;
  }
  function saveTempRetentionMinutes(v: number) {
    try {
      localStorage.setItem(TEMP_RETENTION_KEY, String(v));
    } catch {
      /* ignore */
    }
  }
  /** How long an unpinned (temporary) conversation survives in localStorage. */
  const temporaryRetentionMinutes = ref<number>(loadTempRetentionMinutes());
  watch(temporaryRetentionMinutes, saveTempRetentionMinutes);

  function setTemporaryRetentionMinutes(minutes: number) {
    temporaryRetentionMinutes.value = Math.max(
      0,
      Math.floor(Number.isFinite(minutes) ? minutes : 0),
    );
  }

  const CHAT_ICON_VISIBILITY_KEY = 'harness-chat-icon-visibility';
  function loadChatIconVisibility(): ChatIconVisibility {
    try {
      const saved = JSON.parse(
        localStorage.getItem(CHAT_ICON_VISIBILITY_KEY) || '{}',
      );
      return { ...DEFAULT_CHAT_ICON_VISIBILITY, ...saved };
    } catch {
      return { ...DEFAULT_CHAT_ICON_VISIBILITY };
    }
  }
  function saveChatIconVisibility(v: ChatIconVisibility) {
    try {
      localStorage.setItem(CHAT_ICON_VISIBILITY_KEY, JSON.stringify(v));
    } catch {
      /* ignore */
    }
  }
  /** Which action icons are shown on the user-prompt header and history. */
  const chatIconVisibility = ref<ChatIconVisibility>(loadChatIconVisibility());
  watch(chatIconVisibility, saveChatIconVisibility, { deep: true });

  function setChatIconVisibility(key: ChatIconKey, value: boolean) {
    chatIconVisibility.value[key] = value;
  }

  const CHART_CONFIG_KEY = 'harness-chart-config';
  function loadChartConfig(): ChartConfig {
    try {
      const saved = JSON.parse(localStorage.getItem(CHART_CONFIG_KEY) || '{}');
      return { ...DEFAULT_CHART_CONFIG, ...saved };
    } catch {
      return { ...DEFAULT_CHART_CONFIG };
    }
  }
  function saveChartConfig(v: ChartConfig) {
    try {
      localStorage.setItem(CHART_CONFIG_KEY, JSON.stringify(v));
    } catch {
      /* ignore */
    }
  }
  /** Global defaults every stock chart inherits unless overridden per chart. */
  const chartConfig = ref<ChartConfig>(loadChartConfig());
  watch(chartConfig, saveChartConfig, { deep: true });

  function setChartConfig(patch: Partial<ChartConfig>) {
    chartConfig.value = { ...chartConfig.value, ...patch };
  }

  const CNT_KEY = 'harness-show-counters';
  function loadShowCounters(): boolean {
    try {
      return localStorage.getItem(CNT_KEY) === 'true';
    } catch {
      return true;
    }
  }
  function saveShowCounters(v: boolean) {
    try {
      localStorage.setItem(CNT_KEY, String(v));
    } catch {
      /* ignore */
    }
  }
  const showCounters = ref(loadShowCounters());

  watch(showCounters, saveShowCounters);

  function toggleShowCounters() {
    showCounters.value = !showCounters.value;
  }

  const WARM_MODEL_KEY = 'harness-warm-model-on-select';
  function loadWarmModelOnSelect(): boolean {
    try {
      return localStorage.getItem(WARM_MODEL_KEY) === 'true';
    } catch {
      return false;
    }
  }
  function saveWarmModelOnSelect(v: boolean) {
    try {
      localStorage.setItem(WARM_MODEL_KEY, String(v));
    } catch {
      /* ignore */
    }
  }
  /** Opt-in: pre-load local model weights in Ollama when a model is selected. */
  const warmModelOnSelect = ref(loadWarmModelOnSelect());

  watch(warmModelOnSelect, saveWarmModelOnSelect);

  function toggleWarmModelOnSelect() {
    warmModelOnSelect.value = !warmModelOnSelect.value;
  }

  watch(showChatStar, saveStar);

  watch(activeTab, (tab) => {
    if (tab === 'chat') {
      showChatStar.value = false;
    }
  });

  function notifyChatResponse() {
    if (activeTab.value !== 'chat') {
      showChatStar.value = true;
    }
  }

  async function handleCopyToClipboard(text: string, index: number) {
    await copy(text);
    copiedIndex.value = index;
    startCopiedIndexReset();
  }

  const requestId = ref(createId());

  function refreshRequestId() {
    requestId.value = createId();
  }

  async function abortJob(requestId: string): Promise<boolean> {
    abortingId.value = requestId;
    const toast = useToast();

    try {
      const res = await fetch(getApiUrl('/api/v1/harness/cancel'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.warn('Abort failed:', text);
        toast.error(i18n.global.t('toast.failedCancelRequest'));
        abortingId.value = null;
        return false;
      }

      const data = await res.json();
      abortingId.value = null;
      const success = data.success ?? false;
      if (success) toast.info(i18n.global.t('toast.requestCancelled'));
      else toast.error(i18n.global.t('toast.failedCancelRequest'));
      return success;
    } catch (err) {
      console.error('Failed to abort job:', err);
      toast.error(i18n.global.t('toast.failedCancelRequest'));
      abortingId.value = null;
      return false;
    }
  }

  return {
    activeTab,
    setActiveTab,
    abortingId,
    copiedIndex,
    showChatStar,
    requestId,
    tabVisibility,
    showCounters,
    warmModelOnSelect,
    defaultScrollMode,
    conversationScrollModes,
    defaultMediaPriority,
    conversationMediaPriorities,
    temporaryRetentionMinutes,
    chatIconVisibility,
    chartConfig,
    refreshRequestId,
    setDefaultScrollMode,
    getConversationScrollMode,
    setConversationScrollMode,
    setDefaultMediaPriority,
    getConversationMediaPriority,
    setConversationMediaPriority,
    setTemporaryRetentionMinutes,
    setChatIconVisibility,
    setChartConfig,
    notifyChatResponse,
    handleCopyToClipboard,
    abortJob,
    isTabVisible,
    toggleTabVisibility,
    toggleShowCounters,
    toggleWarmModelOnSelect,
  };
});
