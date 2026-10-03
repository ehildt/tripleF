import {
  Clapperboard,
  FileText,
  Film,
  Globe,
  Image,
  Images,
  Key,
  Languages,
  Link,
  type LucideIcon,
  MapPin,
  Newspaper,
  ShoppingCart,
  Star,
} from '@lucide/vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { useAppStore } from '@/stores/app';
import { useModelsStore } from '@/stores/models';
import type { ScrollMode } from '@/types/app.model';
import type { CollapsibleSectionKey } from '@/types/harness-response-data.model';

import { useChatContextSize } from '../../composables/use-chat-context-size';
import { useChatConversation } from '../../composables/use-chat-conversation';
import { useChatDropdowns } from '../../composables/use-chat-dropdowns';
import { useChatInput } from '../../composables/use-chat-input';
import { useChatThink } from '../../composables/use-chat-think';
import { usePromptDraft } from '../../composables/use-prompt-draft';
import { useSearchEngineAvailability } from '../../composables/use-search-engine-availability';
import { mapPresentationToggle } from './helpers/map-presentation-toggle.helper';
import { mapSectionToggle } from './helpers/map-section-toggle.helper';
import { mapSourceTag } from './helpers/map-source-tag.helper';
import { useFileSelect } from './use-file-select.composable';

/** Icon and label per known search source; unknown sources fall back to Search. */
const SOURCE_META: Record<string, { icon: LucideIcon; label: string }> = {
  web: { icon: Globe, label: 'web' },
  images: { icon: Image, label: 'images' },
  news: { icon: Newspaper, label: 'news' },
  shopping: { icon: ShoppingCart, label: 'shopping' },
  webpageFetch: { icon: FileText, label: 'fetch' },
  places: { icon: MapPin, label: 'places' },
  videos: { icon: Film, label: 'videos' },
  reviews: { icon: Star, label: 'reviews' },
};

/** Response-content section types the blue menu can collapse/expand. The
 * media sections (gallery, videoGallery) are not here — they switch
 * presentations instead of hiding. */
const SECTION_TOGGLES: {
  key: CollapsibleSectionKey;
  icon: LucideIcon;
  labelKey: string;
}[] = [
  { key: 'sources', icon: Link, labelKey: 'common.sources' },
  { key: 'keyFindings', icon: Key, labelKey: 'common.keyFindings' },
  {
    key: 'internationalCoverage',
    icon: Languages,
    labelKey: 'common.internationalCoverage',
  },
];

/** Media section types the blue menu switches between gallery/list. */
const PRESENTATION_TOGGLES: {
  key: 'gallery' | 'videoGallery';
  media: 'image' | 'video';
  icon: LucideIcon;
}[] = [
  { key: 'gallery', media: 'image', icon: Images },
  { key: 'videoGallery', media: 'video', icon: Clapperboard },
];

/** Localized switch keys per media type — gallery and list labels. */
const PRESENTATION_SWITCH_KEYS: Record<
  'image' | 'video',
  { toGallery: string; toList: string }
> = {
  image: {
    toGallery: 'common.switchToImageGallery',
    toList: 'common.switchToImageList',
  },
  video: {
    toGallery: 'common.switchToVideoGallery',
    toList: 'common.switchToVideoList',
  },
};

/**
 * The prompt action bar's full self-contained surface: display derivations,
 * model capability checks, the prompt draft, and every action the bar's
 * controls bind to. Composes its dependencies — the active conversation,
 * think/context/dropdown/search-engine state, the prompt draft, and the file
 * picker — by import, so the bar component binds one composable and the
 * chat orchestrator knows nothing about the bar's internals.
 */
export function useChatPromptActionBar() {
  const { t } = useI18n();
  const appStore = useAppStore();
  const modelsStore = useModelsStore();

  const { conversationId, conversation, selectedModelObj } =
    useChatConversation();
  const { filteredThinkOptions, selectThink } = useChatThink();
  const { filteredContextSizeOptions, defaultContextSize, selectContextSize } =
    useChatContextSize();
  const {
    setThinkDropdownRef,
    setContextSizeDropdownRef,
    onThinkOpen,
    onContextSizeOpen,
  } = useChatDropdowns();
  const { onCollapsedKeydown } = useChatInput();
  const { promptDraft } = usePromptDraft();
  const {
    searchEngineState,
    searchSources,
    eodhdState,
    refresh,
    toggleSearchEngine,
    toggleSource,
    toggleEodhd,
  } = useSearchEngineAvailability();

  /** Whether the active conversation has any model picked — name-based so
   * the bar never disables while the catalog is still loading (a selected
   * model whose entry has not resolved yet must still read as "has a model"). */
  const selectedModelName = computed(
    () => conversation.value?.model || modelsStore.selectedModel,
  );
  const hasNoModelSelected = computed(() => !selectedModelName.value);

  /** Vision capability; models without reported capabilities are allowed
   * until their details load, matching the chat model-sync semantics. */
  const supportsVision = computed(
    () => selectedModelObj.value?.capabilities?.includes('vision') ?? true,
  );

  const isFileSelectDisabled = computed(
    () => hasNoModelSelected.value || !supportsVision.value,
  );

  const currentThinkValue = computed(
    () => conversation.value?.think || 'medium',
  );

  const currentContextSizeValue = computed(
    () => conversation.value?.numCtx || defaultContextSize.value,
  );

  /** Formats the raw numCtx option for the context dropdown. */
  const formatContextValue = (value: string): string =>
    modelsStore.formatCtx(Number(value));

  /** Ambient refresh: the server cache owns freshness, so focus just re-asks. */
  function onPromptFocus() {
    modelsStore.fetchModels({ silent: true });
  }

  const {
    acceptedFileTypes,
    setFileInputRef,
    triggerFileSelect,
    onFileInputChange,
  } = useFileSelect(isFileSelectDisabled);

  /** Tooltip shown on the engine toggle when no search engine is configured. */
  const noSearchEngineTitle = computed(() =>
    t('common.noSearchEngineConnectedDesc'),
  );

  const scrollMode = computed(() =>
    appStore.getConversationScrollMode(conversationId.value),
  );

  function toggleScrollMode() {
    const next: ScrollMode =
      scrollMode.value === 'carousel' ? 'native' : 'carousel';
    appStore.setConversationScrollMode(conversationId.value, next);
  }

  const scrollModeTitle = computed(() =>
    scrollMode.value === 'carousel'
      ? t('common.scrollModeCarousel')
      : t('common.scrollModeNative'),
  );

  const sourceMenuCollapsed = computed(() =>
    appStore.getSourceMenuCollapsed(conversationId.value, 'sources'),
  );

  const viewMenuCollapsed = computed(() =>
    appStore.getSourceMenuCollapsed(conversationId.value, 'view'),
  );

  const sourceMenuAlwaysShow = computed(() =>
    appStore.getSourceMenuAlwaysShow(conversationId.value, 'sources'),
  );

  const viewMenuAlwaysShow = computed(() =>
    appStore.getSourceMenuAlwaysShow(conversationId.value, 'view'),
  );

  function toggleSourceMenuCollapsed() {
    appStore.setSourceMenuCollapsed(
      conversationId.value,
      'sources',
      !sourceMenuCollapsed.value,
    );
  }

  function toggleViewMenuCollapsed() {
    appStore.setSourceMenuCollapsed(
      conversationId.value,
      'view',
      !viewMenuCollapsed.value,
    );
  }

  const sourceMenuToggleTitle = computed(() =>
    sourceMenuCollapsed.value
      ? t('common.expandSection')
      : t('common.collapseSection'),
  );

  const viewMenuToggleTitle = computed(() =>
    viewMenuCollapsed.value
      ? t('common.expandSection')
      : t('common.collapseSection'),
  );

  /** Blue-menu toggles: one per response section type, with its current
   * hidden state and a localized hide/show label — the sections are hidden,
   * not collapsed, so the wording says so. */
  const sectionToggles = computed(() =>
    SECTION_TOGGLES.map((toggle) => {
      const { key, icon, hidden, titleKey } = mapSectionToggle(
        toggle,
        appStore.collapsedSections,
      );
      return {
        key,
        icon,
        hidden,
        title: t(titleKey, { section: t(toggle.labelKey) }),
      };
    }),
  );

  function toggleSection(section: CollapsibleSectionKey) {
    appStore.toggleSectionCollapsed(section);
  }

  /** Blue-menu media toggles: one per media section type, with its active
   * presentation and a localized switch label. The media sections are never
   * hidden — the toggle flips gallery ↔ list. */
  const presentationToggles = computed(() =>
    PRESENTATION_TOGGLES.map((toggle) => {
      const { key, media, icon, presentation, titleKey } =
        mapPresentationToggle(
          toggle,
          appStore.mediaPresentations,
          PRESENTATION_SWITCH_KEYS,
        );
      return { key, media, icon, presentation, title: t(titleKey) };
    }),
  );

  function togglePresentation(media: 'image' | 'video') {
    appStore.toggleMediaPresentation(media);
  }

  const fileSelectTitle = computed(() =>
    !supportsVision.value
      ? t('common.fileSelectNoImages')
      : t('common.selectFiles'),
  );

  const actionsClass = computed(() => ({
    'prompt-actions': true,
    'prompt-actions--with-indicator': searchEngineState.value !== 'unknown',
  }));

  /**
   * The tags at the top edge of the prompt input — toggle buttons, one per
   * search source. `searchSources` already only contains sources of enabled
   * engines (and excludes EODHD), so the tags render whenever at least one
   * engine is on; the kill switch, API-key gating, and EODHD exclusion all
   * happen upstream. Enabled sources render colored, disabled ones gray;
   * clicking flips the state with immediate visual feedback.
   */
  const sourceTags = computed(() =>
    searchSources.value.map((source) => {
      const { key, enabled, icon, label, titleKey } = mapSourceTag(
        source,
        SOURCE_META,
      );
      return { key, enabled, icon, title: t(titleKey, { label }) };
    }),
  );

  const searchEngineToggleTitle = computed(() =>
    searchEngineState.value === 'enabled'
      ? t('common.searchEngineConnected')
      : t('common.searchEngineDisabled'),
  );

  const eodhdToggleTitle = computed(() =>
    eodhdState.value?.enabled
      ? t('common.eodhdEnabled')
      : t('common.eodhdDisabled'),
  );

  return {
    promptDraft,
    onCollapsedKeydown,
    onPromptFocus,
    fileSelectTitle,
    actionsClass,
    sourceTags,
    searchEngineToggleTitle,
    eodhdToggleTitle,
    noSearchEngineTitle,
    scrollMode,
    toggleScrollMode,
    scrollModeTitle,
    sourceMenuCollapsed,
    toggleSourceMenuCollapsed,
    sourceMenuToggleTitle,
    sourceMenuAlwaysShow,
    viewMenuCollapsed,
    toggleViewMenuCollapsed,
    viewMenuToggleTitle,
    viewMenuAlwaysShow,
    sectionToggles,
    toggleSection,
    presentationToggles,
    togglePresentation,
    eodhdState,
    filteredThinkOptions,
    currentThinkValue,
    selectThink,
    filteredContextSizeOptions,
    currentContextSizeValue,
    selectContextSize,
    formatContextValue,
    hasNoModelSelected,
    setThinkDropdownRef,
    setContextSizeDropdownRef,
    onThinkOpen,
    onContextSizeOpen,
    isFileSelectDisabled,
    searchEngineState,
    toggleSearchEngine,
    toggleSource,
    toggleEodhd,
    acceptedFileTypes,
    setFileInputRef,
    triggerFileSelect,
    onFileInputChange,
    refresh,
  };
}
