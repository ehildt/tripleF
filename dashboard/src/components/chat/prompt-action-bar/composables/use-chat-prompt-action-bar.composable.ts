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
  Search,
  ShoppingCart,
  Star,
} from '@lucide/vue';
import { computed, type EmitFn } from 'vue';
import { useI18n } from 'vue-i18n';

import { useAppStore } from '@/stores/app';
import type { ScrollMode } from '@/types/app.model';
import type { CollapsibleSectionKey } from '@/types/harness-response-data.model';

import type { ChatPromptActionBarProps } from '../ChatPromptActionBar.types';

export interface ChatPromptActionBarEmits {
  input: [event: Event];
  keydown: [event: KeyboardEvent];
  focus: [];
  selectThink: [think: string];
  selectContextSize: [ctx: string];
  openThink: [];
  openContextSize: [];
  disabledHoverStart: [];
  disabledHoverEnd: [];
  fileSelect: [];
  toggleSearchEngine: [];
  toggleSource: [source: string];
  toggleEodhd: [];
}

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

const noSearchEngineTitle =
  "No search engine connected — answers come from the model's training data. Enable one in SysCtl → Search Engines.";

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
 * Derives the prompt action bar's display state from its props: the file
 * button classes, the search-source tags, and the engine toggle titles.
 */
export function useChatPromptActionBar(
  props: ChatPromptActionBarProps,
  emit: EmitFn<ChatPromptActionBarEmits>,
) {
  const { t } = useI18n();
  const appStore = useAppStore();

  const scrollMode = computed(() =>
    appStore.getConversationScrollMode(props.conversationId),
  );

  function toggleScrollMode() {
    const next: ScrollMode =
      scrollMode.value === 'carousel' ? 'native' : 'carousel';
    appStore.setConversationScrollMode(props.conversationId, next);
  }

  const scrollModeTitle = computed(() =>
    scrollMode.value === 'carousel'
      ? t('common.scrollModeCarousel')
      : t('common.scrollModeNative'),
  );

  const sourceMenuCollapsed = computed(
    () => appStore.sourceTagsMenuCollapsed.sources,
  );

  const viewMenuCollapsed = computed(
    () => appStore.sourceTagsMenuCollapsed.view,
  );

  const sourceMenuAlwaysShow = computed(
    () => appStore.sourceTagsMenuAlwaysShow.sources,
  );

  const viewMenuAlwaysShow = computed(
    () => appStore.sourceTagsMenuAlwaysShow.view,
  );

  function toggleSourceMenuCollapsed() {
    appStore.setSourceTagsMenuCollapsed('sources', !sourceMenuCollapsed.value);
  }

  function toggleViewMenuCollapsed() {
    appStore.setSourceTagsMenuCollapsed('view', !viewMenuCollapsed.value);
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
    SECTION_TOGGLES.map(({ key, icon, labelKey }) => {
      const hidden = appStore.collapsedSections[key];
      const name = t(labelKey);
      return {
        key,
        icon,
        hidden,
        title: hidden
          ? t('common.showSectionWithName', { section: name })
          : t('common.hideSectionWithName', { section: name }),
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
    PRESENTATION_TOGGLES.map(({ key, media, icon }) => {
      const presentation = appStore.mediaPresentations[media];
      const switchKey =
        presentation === 'gallery'
          ? PRESENTATION_SWITCH_KEYS[media].toList
          : PRESENTATION_SWITCH_KEYS[media].toGallery;
      return {
        key,
        media,
        icon,
        presentation,
        title: t(switchKey),
      };
    }),
  );

  function togglePresentation(media: 'image' | 'video') {
    appStore.toggleMediaPresentation(media);
  }

  const fileSelectTitle = computed(
    () => props.fileSelectDisabledReason || t('common.selectFiles'),
  );

  const actionsClass = computed(() => ({
    'prompt-actions': true,
    'prompt-actions--with-indicator':
      props.searchEngineState !== undefined &&
      props.searchEngineState !== 'unknown',
  }));

  /**
   * The tags at the top edge of the prompt input — toggle buttons, one per
   * search source, shown only while a search engine is enabled. Enabled
   * sources render colored, disabled ones gray; clicking flips the state
   * with immediate visual feedback. Kill switch off or no engine available
   * hides the strip entirely.
   */
  const sourceTags = computed(() => {
    if (props.searchEngineState !== 'enabled') return [];
    return (props.searchSources ?? []).map(({ key, enabled }) => ({
      key,
      enabled,
      // Unknown sources fall back to a distinct Search icon — never one of
      // the mapped icons, so the tags never repeat.
      icon: SOURCE_META[key]?.icon ?? Search,
      label: SOURCE_META[key]?.label ?? key,
      title: enabled
        ? t('common.sourceEnabled', {
            label: SOURCE_META[key]?.label ?? key,
          })
        : t('common.sourceDisabled', {
            label: SOURCE_META[key]?.label ?? key,
          }),
    }));
  });

  const searchEngineToggleTitle = computed(() =>
    props.searchEngineState === 'enabled'
      ? t('common.searchEngineConnected')
      : t('common.searchEngineDisabled'),
  );

  const eodhdToggleTitle = computed(() =>
    props.eodhdState?.enabled
      ? t('common.eodhdEnabled')
      : t('common.eodhdDisabled'),
  );

  function onFileButtonMouseEnter() {
    if (props.isFileSelectDisabled) {
      emit('disabledHoverStart');
    }
  }

  function onFileButtonMouseLeave() {
    if (props.isFileSelectDisabled) {
      emit('disabledHoverEnd');
    }
  }

  return {
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
    onFileButtonMouseEnter,
    onFileButtonMouseLeave,
  };
}
