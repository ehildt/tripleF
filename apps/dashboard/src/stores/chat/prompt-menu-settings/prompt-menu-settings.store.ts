import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

import { parseConversationSourceTagsMenuAlwaysShow } from './helpers/parse-conversation-source-tags-menu-always-show.helper';
import { parseConversationSourceTagsMenuCollapsed } from './helpers/parse-conversation-source-tags-menu-collapsed.helper';
import { parseSourceTagsMenuAlwaysShow } from './helpers/parse-source-tags-menu-always-show.helper';
import { parseSourceTagsMenuCollapsed } from './helpers/parse-source-tags-menu-collapsed.helper';
import {
  CONVERSATION_SOURCE_TAGS_MENU_ALWAYS_SHOW_KEY,
  CONVERSATION_SOURCE_TAGS_MENU_KEY,
  DEFAULT_SOURCE_TAGS_MENU_ALWAYS_SHOW,
  DEFAULT_SOURCE_TAGS_MENU_COLLAPSED,
  SOURCE_TAGS_MENU_ALWAYS_SHOW_KEY,
  SOURCE_TAGS_MENU_KEY,
} from './prompt-menu-settings.constant';
import type {
  SourceTagsMenuAlwaysShow,
  SourceTagsMenuCollapsed,
} from './prompt-menu-settings.model';

export const usePromptMenuSettingsStore = defineStore(
  'prompt-menu-settings',
  () => {
    /** Whether each prompt-bar icon menu is collapsed to its expand arrow. */
    const sourceTagsMenuCollapsed = ref<SourceTagsMenuCollapsed>({
      ...DEFAULT_SOURCE_TAGS_MENU_COLLAPSED,
    });
    try {
      sourceTagsMenuCollapsed.value = parseSourceTagsMenuCollapsed(
        localStorage.getItem(SOURCE_TAGS_MENU_KEY),
      );
    } catch {
      /* Storage unavailable: retain collapse defaults. */
    }

    /** Whether each prompt-bar icon menu is pinned open. */
    const sourceTagsMenuAlwaysShow = ref<SourceTagsMenuAlwaysShow>({
      ...DEFAULT_SOURCE_TAGS_MENU_ALWAYS_SHOW,
    });
    try {
      sourceTagsMenuAlwaysShow.value = parseSourceTagsMenuAlwaysShow(
        localStorage.getItem(SOURCE_TAGS_MENU_ALWAYS_SHOW_KEY),
      );
    } catch {
      /* Storage unavailable: retain always-show defaults. */
    }

    const conversationSourceTagsMenuCollapsed = ref<
      Record<string, SourceTagsMenuCollapsed>
    >({});
    try {
      conversationSourceTagsMenuCollapsed.value =
        parseConversationSourceTagsMenuCollapsed(
          localStorage.getItem(CONVERSATION_SOURCE_TAGS_MENU_KEY),
        );
    } catch {
      /* Storage unavailable: retain no collapse overrides. */
    }

    const conversationSourceTagsMenuAlwaysShow = ref<
      Record<string, SourceTagsMenuAlwaysShow>
    >({});
    try {
      conversationSourceTagsMenuAlwaysShow.value =
        parseConversationSourceTagsMenuAlwaysShow(
          localStorage.getItem(CONVERSATION_SOURCE_TAGS_MENU_ALWAYS_SHOW_KEY),
        );
    } catch {
      /* Storage unavailable: retain no always-show overrides. */
    }

    watch(
      sourceTagsMenuCollapsed,
      (value) => {
        try {
          localStorage.setItem(SOURCE_TAGS_MENU_KEY, JSON.stringify(value));
        } catch {
          /* Storage unavailable: retain collapse preferences in memory. */
        }
      },
      { deep: true },
    );
    watch(
      sourceTagsMenuAlwaysShow,
      (value) => {
        try {
          localStorage.setItem(
            SOURCE_TAGS_MENU_ALWAYS_SHOW_KEY,
            JSON.stringify(value),
          );
        } catch {
          /* Storage unavailable: retain always-show preferences in memory. */
        }
      },
      { deep: true },
    );
    watch(
      conversationSourceTagsMenuCollapsed,
      (value) => {
        try {
          localStorage.setItem(
            CONVERSATION_SOURCE_TAGS_MENU_KEY,
            JSON.stringify(value),
          );
        } catch {
          /* Storage unavailable: retain collapse overrides in memory. */
        }
      },
      { deep: true },
    );
    watch(
      conversationSourceTagsMenuAlwaysShow,
      (value) => {
        try {
          localStorage.setItem(
            CONVERSATION_SOURCE_TAGS_MENU_ALWAYS_SHOW_KEY,
            JSON.stringify(value),
          );
        } catch {
          /* Storage unavailable: retain always-show overrides in memory. */
        }
      },
      { deep: true },
    );

    function setSourceTagsMenuCollapsed(
      menu: keyof SourceTagsMenuCollapsed,
      collapsed: boolean,
    ): void {
      sourceTagsMenuCollapsed.value[menu] = collapsed;
    }

    function setSourceTagsMenuAlwaysShow(
      menu: keyof SourceTagsMenuAlwaysShow,
      alwaysShow: boolean,
    ): void {
      sourceTagsMenuAlwaysShow.value[menu] = alwaysShow;
    }

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
    ): void {
      if (!conversationSourceTagsMenuCollapsed.value[conversationId]) {
        conversationSourceTagsMenuCollapsed.value[conversationId] = {
          ...sourceTagsMenuCollapsed.value,
        };
      }
      conversationSourceTagsMenuCollapsed.value[conversationId][menu] =
        collapsed;
    }

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
    ): void {
      if (!conversationSourceTagsMenuAlwaysShow.value[conversationId]) {
        conversationSourceTagsMenuAlwaysShow.value[conversationId] = {
          ...sourceTagsMenuAlwaysShow.value,
        };
      }
      conversationSourceTagsMenuAlwaysShow.value[conversationId][menu] =
        alwaysShow;
    }

    return {
      sourceTagsMenuCollapsed,
      sourceTagsMenuAlwaysShow,
      conversationSourceTagsMenuCollapsed,
      conversationSourceTagsMenuAlwaysShow,
      setSourceTagsMenuCollapsed,
      setSourceTagsMenuAlwaysShow,
      getSourceMenuCollapsed,
      setSourceMenuCollapsed,
      getSourceMenuAlwaysShow,
      setSourceMenuAlwaysShow,
    };
  },
);
