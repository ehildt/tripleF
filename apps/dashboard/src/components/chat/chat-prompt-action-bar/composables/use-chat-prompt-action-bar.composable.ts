import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { useAppStore } from '@/stores/app';
import { useModelsStore } from '@/stores/models';
import type { ScrollMode } from '@/types/app.model';

import { useChatContextSize } from '../../composables/use-chat-context-size';
import { useChatConversation } from '../../composables/use-chat-conversation';
import { useSearchEngineAvailability } from '../../composables/use-search-engine-availability';
import { mapPresentationToggle } from './helpers/map-presentation-toggle.helper';
import { mapSectionToggle } from './helpers/map-section-toggle.helper';
import { mapSourceTag } from './helpers/map-source-tag.helper';
import { SEARCH_SOURCE_META } from './search-source-meta.constant';
import {
  PRESENTATION_SWITCH_KEYS,
  PRESENTATION_TOGGLES,
  SECTION_TOGGLES,
} from './view-menu-toggles.constant';

/**
 * The prompt action bar's own derived presentation surface: display
 * derivations, the model capability checks, the localized titles, and the
 * bar-level store toggles (scroll mode, menu collapse, section/presentation
 * visibility). The raw bindings the bar's controls need — the prompt draft,
 * the think/context/dropdown surfaces, the search-engine toggles, and the
 * file picker — are bound by ChatPromptActionBar.vue directly from their
 * source composables; this composable imports only what it derives from
 * (conversation, context defaults, search-engine state) and never re-exports
 * those members unchanged.
 */
export function useChatPromptActionBar() {
  const { t } = useI18n();
  const appStore = useAppStore();
  const modelsStore = useModelsStore();

  const { conversationId, conversation, selectedModelObj } =
    useChatConversation();
  const { defaultContextSize } = useChatContextSize();
  const { searchEngineState, eodhdState, searchSources } =
    useSearchEngineAvailability();

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

  const currentThinkValue = computed(
    () => conversation.value?.think || 'medium',
  );

  const currentContextSizeValue = computed(
    () => conversation.value?.numCtx || defaultContextSize.value,
  );

  /** Ambient refresh: the server cache owns freshness, so focus just re-asks. */
  function onPromptFocus() {
    modelsStore.fetchModels({ silent: true });
  }

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
        SEARCH_SOURCE_META,
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
    presentationToggles,
    currentThinkValue,
    currentContextSizeValue,
    hasNoModelSelected,
  };
}
