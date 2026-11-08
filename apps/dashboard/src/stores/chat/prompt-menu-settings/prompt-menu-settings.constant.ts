import type {
  SourceTagsMenuAlwaysShow,
  SourceTagsMenuCollapsed,
} from './prompt-menu-settings.model';

export const SOURCE_TAGS_MENU_KEY = 'harness-source-tags-menu';
export const SOURCE_TAGS_MENU_ALWAYS_SHOW_KEY =
  'harness-source-tags-menu-always-show';
export const CONVERSATION_SOURCE_TAGS_MENU_KEY =
  'harness-conversation-source-tags-menu';
export const CONVERSATION_SOURCE_TAGS_MENU_ALWAYS_SHOW_KEY =
  'harness-conversation-source-tags-menu-always-show';

export const DEFAULT_SOURCE_TAGS_MENU_COLLAPSED: SourceTagsMenuCollapsed = {
  sources: false,
  view: false,
};

export const DEFAULT_SOURCE_TAGS_MENU_ALWAYS_SHOW: SourceTagsMenuAlwaysShow = {
  sources: true,
  view: true,
};
