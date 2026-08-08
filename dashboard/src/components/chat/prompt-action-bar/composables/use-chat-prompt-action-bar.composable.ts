import {
  FileText,
  Film,
  Globe,
  Image,
  type LucideIcon,
  MapPin,
  Newspaper,
  Search,
  ShoppingCart,
  Star,
} from '@lucide/vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

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

/**
 * Derives the prompt action bar's display state from its props: the file
 * button classes, the search-source tags, and the engine toggle titles.
 */
export function useChatPromptActionBar(
  props: ChatPromptActionBarProps,
  emit: ChatPromptActionBarEmits,
) {
  const { t } = useI18n();

  const fileSelectClass = computed(() => ({
    'chat-prompt-action-bar__file-button': true,
    'chat-prompt-action-bar__file-button--disabled': props.isFileSelectDisabled,
  }));

  const fileSelectTitle = computed(
    () => props.fileSelectDisabledReason || t('common.selectFiles'),
  );

  const actionsClass = computed(() => ({
    'chat-prompt-action-bar__actions': true,
    'chat-prompt-action-bar__actions--with-indicator':
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
    fileSelectClass,
    fileSelectTitle,
    actionsClass,
    sourceTags,
    searchEngineToggleTitle,
    eodhdToggleTitle,
    noSearchEngineTitle,
    onFileButtonMouseEnter,
    onFileButtonMouseLeave,
  };
}
