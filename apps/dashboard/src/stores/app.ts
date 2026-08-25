import { useClipboard, useTimeoutFn } from '@vueuse/core';
import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

import { getApiUrl } from '@/api/api-url';
import { fetchConfig, saveConfig } from '@/api/config.api';
import { i18n } from '@/i18n/i18n';
import { getPersistentSocketSessionId } from '@/stores/helpers/socket/get-persistent-socket-session-id.helper';

import { useToast } from '../composables/use-toast';
import type {
  ActiveTab,
  ChartConfig,
  ChatIconKey,
  ChatIconVisibility,
  ScrollMode,
  SourceTagsMenuAlwaysShow,
  SourceTagsMenuCollapsed,
} from '../types/app.model';
import type {
  CollapsedSections,
  CollapsibleSectionKey,
} from '../types/harness-response-data.model';
import type {
  MediaPresentation,
  MediaPresentations,
  MediaPriority,
} from '../types/harness-response-data.model';
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
   * Tabs hidden unless explicitly enabled: debug starts disabled, so the
   * user opts in via SysCtl. `dlq` (dead letter) is on by default; `sockets`
   * (the chat toolbar sockets menu) is off by default. `http`/`sysctl` are
   * core.
   */
  const DEFAULT_TAB_VISIBILITY: Record<string, boolean> = {
    chat: true,
    dlq: true,
    debug: false,
    sockets: false,
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
    tabVisibility.value[tab] = !isTabVisible(tab);
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

  const DOCUMENT_TEXT_LIMIT_KEY = 'harness-document-text-limit';
  const DEFAULT_DOCUMENT_TEXT_LIMIT = 200_000;
  function loadDocumentTextLimit(): number {
    try {
      const raw = localStorage.getItem(DOCUMENT_TEXT_LIMIT_KEY);
      if (raw === null) return DEFAULT_DOCUMENT_TEXT_LIMIT;
      const parsed = Number(raw);
      return Number.isFinite(parsed) && parsed > 0
        ? parsed
        : DEFAULT_DOCUMENT_TEXT_LIMIT;
    } catch {
      return DEFAULT_DOCUMENT_TEXT_LIMIT;
    }
  }
  function saveDocumentTextLimit(value: number) {
    try {
      localStorage.setItem(DOCUMENT_TEXT_LIMIT_KEY, String(value));
    } catch {
      /* ignore */
    }
  }
  /** Max characters of extracted document text kept per file; the rest is
   * truncated with a toast. Configurable so it can grow as models do. */
  const documentTextLimit = ref<number>(loadDocumentTextLimit());
  watch(documentTextLimit, saveDocumentTextLimit);

  function setDocumentTextLimit(value: number) {
    documentTextLimit.value = value;
  }

  const SOURCE_TAGS_MENU_KEY = 'harness-source-tags-menu';
  const DEFAULT_SOURCE_TAGS_MENU_COLLAPSED: SourceTagsMenuCollapsed = {
    sources: false,
    view: false,
  };
  function loadSourceTagsMenuCollapsed(): SourceTagsMenuCollapsed {
    try {
      const saved = JSON.parse(
        localStorage.getItem(SOURCE_TAGS_MENU_KEY) || '{}',
      );
      return { ...DEFAULT_SOURCE_TAGS_MENU_COLLAPSED, ...saved };
    } catch {
      return { ...DEFAULT_SOURCE_TAGS_MENU_COLLAPSED };
    }
  }
  function saveSourceTagsMenuCollapsed(v: SourceTagsMenuCollapsed) {
    try {
      localStorage.setItem(SOURCE_TAGS_MENU_KEY, JSON.stringify(v));
    } catch {
      /* ignore */
    }
  }
  /** Whether each prompt-bar icon menu is collapsed to its expand arrow. */
  const sourceTagsMenuCollapsed = ref<SourceTagsMenuCollapsed>(
    loadSourceTagsMenuCollapsed(),
  );
  watch(sourceTagsMenuCollapsed, saveSourceTagsMenuCollapsed, { deep: true });

  function setSourceTagsMenuCollapsed(
    menu: keyof SourceTagsMenuCollapsed,
    collapsed: boolean,
  ) {
    sourceTagsMenuCollapsed.value[menu] = collapsed;
  }

  const SOURCE_TAGS_MENU_ALWAYS_SHOW_KEY =
    'harness-source-tags-menu-always-show';
  const DEFAULT_SOURCE_TAGS_MENU_ALWAYS_SHOW: SourceTagsMenuAlwaysShow = {
    sources: true,
    view: true,
  };
  function loadSourceTagsMenuAlwaysShow(): SourceTagsMenuAlwaysShow {
    try {
      const saved = JSON.parse(
        localStorage.getItem(SOURCE_TAGS_MENU_ALWAYS_SHOW_KEY) || '{}',
      );
      return { ...DEFAULT_SOURCE_TAGS_MENU_ALWAYS_SHOW, ...saved };
    } catch {
      return { ...DEFAULT_SOURCE_TAGS_MENU_ALWAYS_SHOW };
    }
  }
  function saveSourceTagsMenuAlwaysShow(v: SourceTagsMenuAlwaysShow) {
    try {
      localStorage.setItem(SOURCE_TAGS_MENU_ALWAYS_SHOW_KEY, JSON.stringify(v));
    } catch {
      /* ignore */
    }
  }
  /** Whether each prompt-bar icon menu is pinned open (no collapse arrow). */
  const sourceTagsMenuAlwaysShow = ref<SourceTagsMenuAlwaysShow>(
    loadSourceTagsMenuAlwaysShow(),
  );
  watch(sourceTagsMenuAlwaysShow, saveSourceTagsMenuAlwaysShow, { deep: true });

  function setSourceTagsMenuAlwaysShow(
    menu: keyof SourceTagsMenuAlwaysShow,
    alwaysShow: boolean,
  ) {
    sourceTagsMenuAlwaysShow.value[menu] = alwaysShow;
  }

  /* ---- per-conversation prompt-bar menu overrides ----
   * The collapse / always-show state of each prompt-bar icon menu (sources,
   * view) is remembered per conversation, falling back to the global default
   * above when the conversation has no override yet. Mirrors the per-
   * conversation scroll-mode overrides. */
  const CONVERSATION_SOURCE_TAGS_MENU_KEY =
    'harness-conversation-source-tags-menu';
  function loadConversationSourceTagsMenuCollapsed(): Record<
    string,
    SourceTagsMenuCollapsed
  > {
    try {
      return JSON.parse(
        localStorage.getItem(CONVERSATION_SOURCE_TAGS_MENU_KEY) || '{}',
      );
    } catch {
      return {};
    }
  }
  function saveConversationSourceTagsMenuCollapsed(
    v: Record<string, SourceTagsMenuCollapsed>,
  ) {
    try {
      localStorage.setItem(
        CONVERSATION_SOURCE_TAGS_MENU_KEY,
        JSON.stringify(v),
      );
    } catch {
      /* ignore */
    }
  }
  const conversationSourceTagsMenuCollapsed = ref<
    Record<string, SourceTagsMenuCollapsed>
  >(loadConversationSourceTagsMenuCollapsed());
  watch(
    conversationSourceTagsMenuCollapsed,
    saveConversationSourceTagsMenuCollapsed,
    { deep: true },
  );

  function getSourceMenuCollapsed(
    conversationId: string,
    menu: keyof SourceTagsMenuCollapsed,
  ): boolean {
    return (
      conversationSourceTagsMenuCollapsed.value[conversationId]?.[menu] ??
      sourceTagsMenuCollapsed.value[menu]
    );
  }

  function setSourceMenuCollapsed(
    conversationId: string,
    menu: keyof SourceTagsMenuCollapsed,
    collapsed: boolean,
  ) {
    if (!conversationSourceTagsMenuCollapsed.value[conversationId]) {
      conversationSourceTagsMenuCollapsed.value[conversationId] = {
        ...sourceTagsMenuCollapsed.value,
      };
    }
    conversationSourceTagsMenuCollapsed.value[conversationId][menu] = collapsed;
  }

  const CONVERSATION_SOURCE_TAGS_MENU_ALWAYS_SHOW_KEY =
    'harness-conversation-source-tags-menu-always-show';
  function loadConversationSourceTagsMenuAlwaysShow(): Record<
    string,
    SourceTagsMenuAlwaysShow
  > {
    try {
      return JSON.parse(
        localStorage.getItem(CONVERSATION_SOURCE_TAGS_MENU_ALWAYS_SHOW_KEY) ||
          '{}',
      );
    } catch {
      return {};
    }
  }
  function saveConversationSourceTagsMenuAlwaysShow(
    v: Record<string, SourceTagsMenuAlwaysShow>,
  ) {
    try {
      localStorage.setItem(
        CONVERSATION_SOURCE_TAGS_MENU_ALWAYS_SHOW_KEY,
        JSON.stringify(v),
      );
    } catch {
      /* ignore */
    }
  }
  const conversationSourceTagsMenuAlwaysShow = ref<
    Record<string, SourceTagsMenuAlwaysShow>
  >(loadConversationSourceTagsMenuAlwaysShow());
  watch(
    conversationSourceTagsMenuAlwaysShow,
    saveConversationSourceTagsMenuAlwaysShow,
    { deep: true },
  );

  function getSourceMenuAlwaysShow(
    conversationId: string,
    menu: keyof SourceTagsMenuAlwaysShow,
  ): boolean {
    return (
      conversationSourceTagsMenuAlwaysShow.value[conversationId]?.[menu] ??
      sourceTagsMenuAlwaysShow.value[menu]
    );
  }

  function setSourceMenuAlwaysShow(
    conversationId: string,
    menu: keyof SourceTagsMenuAlwaysShow,
    alwaysShow: boolean,
  ) {
    if (!conversationSourceTagsMenuAlwaysShow.value[conversationId]) {
      conversationSourceTagsMenuAlwaysShow.value[conversationId] = {
        ...sourceTagsMenuAlwaysShow.value,
      };
    }
    conversationSourceTagsMenuAlwaysShow.value[conversationId][menu] =
      alwaysShow;
  }

  const COLLAPSED_SECTIONS_KEY = 'harness-collapsed-sections';
  const DEFAULT_COLLAPSED_SECTIONS: CollapsedSections = {
    sources: false,
    keyFindings: false,
    internationalCoverage: false,
  };
  function loadCollapsedSections(): CollapsedSections {
    try {
      const saved = JSON.parse(
        localStorage.getItem(COLLAPSED_SECTIONS_KEY) || '{}',
      );
      return { ...DEFAULT_COLLAPSED_SECTIONS, ...saved };
    } catch {
      return { ...DEFAULT_COLLAPSED_SECTIONS };
    }
  }
  function saveCollapsedSections(v: CollapsedSections) {
    try {
      localStorage.setItem(COLLAPSED_SECTIONS_KEY, JSON.stringify(v));
    } catch {
      /* ignore */
    }
  }
  /** Whether each response section type (gallery, sources, …) is collapsed. */
  const collapsedSections = ref<CollapsedSections>(loadCollapsedSections());
  watch(collapsedSections, saveCollapsedSections, { deep: true });

  function setSectionCollapsed(
    section: CollapsibleSectionKey,
    collapsed: boolean,
  ) {
    collapsedSections.value[section] = collapsed;
  }

  function toggleSectionCollapsed(section: CollapsibleSectionKey) {
    collapsedSections.value[section] = !collapsedSections.value[section];
  }

  const MEDIA_PRESENTATIONS_KEY = 'harness-media-presentations';
  const DEFAULT_MEDIA_PRESENTATIONS: MediaPresentations = {
    image: 'gallery',
    video: 'list',
  };
  function loadMediaPresentations(): MediaPresentations {
    try {
      const saved = JSON.parse(
        localStorage.getItem(MEDIA_PRESENTATIONS_KEY) || '{}',
      );
      return { ...DEFAULT_MEDIA_PRESENTATIONS, ...saved };
    } catch {
      return { ...DEFAULT_MEDIA_PRESENTATIONS };
    }
  }
  function saveMediaPresentations(v: MediaPresentations) {
    try {
      localStorage.setItem(MEDIA_PRESENTATIONS_KEY, JSON.stringify(v));
    } catch {
      /* ignore */
    }
  }
  /** Which presentation each media section renders in (gallery or list). */
  const mediaPresentations = ref<MediaPresentations>(loadMediaPresentations());
  watch(mediaPresentations, saveMediaPresentations, { deep: true });

  function setMediaPresentation(
    media: 'image' | 'video',
    presentation: MediaPresentation,
  ) {
    mediaPresentations.value[media] = presentation;
  }

  function toggleMediaPresentation(media: 'image' | 'video') {
    mediaPresentations.value[media] =
      mediaPresentations.value[media] === 'gallery' ? 'list' : 'gallery';
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

  const MEMORY_PARTITION_KEY = 'harness-memory-partition';
  const LEGACY_MEMORY_TENANT_KEY = 'harness-memory-tenant-id';
  function loadMemoryPartition(): string {
    try {
      // One-time migration of the pre-rename key, then the old slot is dropped.
      const current = localStorage.getItem(MEMORY_PARTITION_KEY);
      if (current !== null) return current.trim();
      const legacy =
        localStorage.getItem(LEGACY_MEMORY_TENANT_KEY)?.trim() ?? '';
      if (legacy) {
        localStorage.setItem(MEMORY_PARTITION_KEY, legacy);
        localStorage.removeItem(LEGACY_MEMORY_TENANT_KEY);
        return legacy;
      }
      return 'default';
    } catch {
      return 'default';
    }
  }
  function saveMemoryPartition(v: string) {
    try {
      if (v) localStorage.setItem(MEMORY_PARTITION_KEY, v);
      else localStorage.removeItem(MEMORY_PARTITION_KEY);
    } catch {
      /* ignore */
    }
  }
  /**
   * Memory partition id — the user's memory space. Defaults to 'default' so
   * memory survives browser-session rotation. Empty string = session is the
   * partition (an explicit opt-in). Persisted to localStorage (fast cache)
   * AND the server config (Postgres), which is the source of truth across
   * browsers/sessions.
   */
  const memoryPartition = ref(loadMemoryPartition());

  watch(memoryPartition, saveMemoryPartition);

  /**
   * Adopt the server-persisted partition id at boot (the server wins over
   * any stale localStorage value — it is the source of truth). Deferred to
   * idle.
   */
  async function syncMemoryPartitionFromServer() {
    try {
      const config = await fetchConfig(getPersistentSocketSessionId());
      if (config?.memoryPartition) {
        memoryPartition.value = config.memoryPartition;
      } else {
        // No server value yet — push the local default so Postgres becomes
        // the source of truth across browsers.
        await saveConfig(getPersistentSocketSessionId(), {
          memoryPartition: memoryPartition.value,
        });
      }
    } catch {
      // Offline — keep the local value; the next set persists.
    }
  }

  function setMemoryPartition(value: string) {
    memoryPartition.value = value.trim();
    // Persist server-side so the value survives localStorage clears.
    saveConfig(getPersistentSocketSessionId(), {
      memoryPartition: value.trim(),
    }).catch(() => {
      // Offline — the local value is kept; a later set retries.
    });
  }

  const MEMORY_COGNITION_KEY = 'harness-memory-cognition';
  function loadMemoryCognition(): string {
    try {
      return localStorage.getItem(MEMORY_COGNITION_KEY)?.trim() || 'default';
    } catch {
      return 'default';
    }
  }
  function saveMemoryCognition(v: string) {
    try {
      if (v) localStorage.setItem(MEMORY_COGNITION_KEY, v);
      else localStorage.removeItem(MEMORY_COGNITION_KEY);
    } catch {
      /* ignore */
    }
  }
  /**
   * Memory cognition id — the AI's own understanding-of-the-user space.
   * Defaults to 'default'. Empty string = cognition lives in the memory
   * partition (same rules as memoryPartition: localStorage fast cache +
   * Postgres source of truth).
   */
  const memoryCognition = ref(loadMemoryCognition());

  watch(memoryCognition, saveMemoryCognition);

  /** Adopt the server-persisted cognition id at boot (server wins). Deferred to idle. */
  async function syncMemoryCognitionFromServer() {
    try {
      const config = await fetchConfig(getPersistentSocketSessionId());
      if (config?.memoryCognition) {
        memoryCognition.value = config.memoryCognition;
        rememberMemoryCognitionSpace(config.memoryCognition);
      } else {
        // No server value yet — push the local default so Postgres becomes
        // the source of truth across browsers.
        await saveConfig(getPersistentSocketSessionId(), {
          memoryCognition: memoryCognition.value,
        });
      }
    } catch {
      // Offline — keep the local value; the next set persists.
    }
  }

  function setMemoryCognition(value: string) {
    memoryCognition.value = value.trim();
    rememberMemoryCognitionSpace(value);
    saveConfig(getPersistentSocketSessionId(), {
      memoryCognition: value.trim(),
    }).catch(() => {
      // Offline — the local value is kept; a later set retries.
    });
  }

  const MEMORY_COGNITION_SPACES_KEY = 'harness-memory-cognition-spaces';
  const MEMORY_COGNITION_SPACES_MAX = 20;
  function loadMemoryCognitionSpaces(): string[] {
    try {
      const raw = localStorage.getItem(MEMORY_COGNITION_SPACES_KEY);
      if (!raw) return ['default'];
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return ['default'];
      const list = parsed
        .filter((entry): entry is string => typeof entry === 'string')
        .map((entry) => entry.trim())
        .filter(Boolean)
        .slice(0, MEMORY_COGNITION_SPACES_MAX);
      return list.length ? list : ['default'];
    } catch {
      return ['default'];
    }
  }
  function saveMemoryCognitionSpaces(spaces: string[]) {
    try {
      if (spaces.length) {
        localStorage.setItem(
          MEMORY_COGNITION_SPACES_KEY,
          JSON.stringify(spaces),
        );
      } else {
        localStorage.removeItem(MEMORY_COGNITION_SPACES_KEY);
      }
    } catch {
      /* ignore */
    }
  }
  /**
   * Cognition space history — the previously used memory-cognition space ids,
   * most-recent-first, deduped and capped. localStorage-local convenience
   * list powering the sysctl space selector (select / remove / create);
   * spaces are implicit Qdrant keys, so "create" is just selecting a new id.
   */
  const memoryCognitionSpaces = ref<string[]>(loadMemoryCognitionSpaces());

  watch(memoryCognitionSpaces, saveMemoryCognitionSpaces);

  /**
   * Record a space id at the front of the history (deduped, capped). Empty
   * ids are ignored — the empty value is the default, not a usable space.
   */
  function rememberMemoryCognitionSpace(space: string) {
    const trimmed = space.trim();
    if (!trimmed) return;
    memoryCognitionSpaces.value = [
      trimmed,
      ...memoryCognitionSpaces.value.filter((entry) => entry !== trimmed),
    ].slice(0, MEMORY_COGNITION_SPACES_MAX);
  }

  /**
   * Drop a space id from the history list. List-only: the space's data in
   * Qdrant is untouched (wiping lives in the cognition panel). Removing the
   * active space resets the field to the default (empty).
   */
  function removeMemoryCognitionSpace(space: string) {
    memoryCognitionSpaces.value = memoryCognitionSpaces.value.filter(
      (entry) => entry !== space,
    );
    if (memoryCognition.value === space) setMemoryCognition('');
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
    memoryPartition,
    setMemoryPartition,
    syncMemoryPartitionFromServer,
    memoryCognition,
    setMemoryCognition,
    syncMemoryCognitionFromServer,
    memoryCognitionSpaces,
    rememberMemoryCognitionSpace,
    removeMemoryCognitionSpace,
    defaultScrollMode,
    conversationScrollModes,
    defaultMediaPriority,
    conversationMediaPriorities,
    temporaryRetentionMinutes,
    chatIconVisibility,
    chartConfig,
    documentTextLimit,
    setDocumentTextLimit,
    sourceTagsMenuCollapsed,
    sourceTagsMenuAlwaysShow,
    collapsedSections,
    mediaPresentations,
    refreshRequestId,
    getSourceMenuCollapsed,
    setSourceMenuCollapsed,
    getSourceMenuAlwaysShow,
    setSourceMenuAlwaysShow,
    setDefaultScrollMode,
    getConversationScrollMode,
    setConversationScrollMode,
    setDefaultMediaPriority,
    getConversationMediaPriority,
    setConversationMediaPriority,
    setTemporaryRetentionMinutes,
    setChatIconVisibility,
    setChartConfig,
    setSourceTagsMenuCollapsed,
    setSourceTagsMenuAlwaysShow,
    setSectionCollapsed,
    toggleSectionCollapsed,
    setMediaPresentation,
    toggleMediaPresentation,
    notifyChatResponse,
    handleCopyToClipboard,
    abortJob,
    isTabVisible,
    toggleTabVisibility,
    toggleShowCounters,
    toggleWarmModelOnSelect,
  };
});
