import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

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

function saveSourceTagsMenuCollapsed(value: SourceTagsMenuCollapsed): void {
  try {
    localStorage.setItem(SOURCE_TAGS_MENU_KEY, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

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

function saveSourceTagsMenuAlwaysShow(value: SourceTagsMenuAlwaysShow): void {
  try {
    localStorage.setItem(
      SOURCE_TAGS_MENU_ALWAYS_SHOW_KEY,
      JSON.stringify(value),
    );
  } catch {
    /* ignore */
  }
}

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
  value: Record<string, SourceTagsMenuCollapsed>,
): void {
  try {
    localStorage.setItem(
      CONVERSATION_SOURCE_TAGS_MENU_KEY,
      JSON.stringify(value),
    );
  } catch {
    /* ignore */
  }
}

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
  value: Record<string, SourceTagsMenuAlwaysShow>,
): void {
  try {
    localStorage.setItem(
      CONVERSATION_SOURCE_TAGS_MENU_ALWAYS_SHOW_KEY,
      JSON.stringify(value),
    );
  } catch {
    /* ignore */
  }
}

export const usePromptMenuSettingsStore = defineStore(
  'prompt-menu-settings',
  () => {
    /** Whether each prompt-bar icon menu is collapsed to its expand arrow. */
    const sourceTagsMenuCollapsed = ref<SourceTagsMenuCollapsed>(
      loadSourceTagsMenuCollapsed(),
    );
    /** Whether each prompt-bar icon menu is pinned open (no collapse arrow). */
    const sourceTagsMenuAlwaysShow = ref<SourceTagsMenuAlwaysShow>(
      loadSourceTagsMenuAlwaysShow(),
    );
    const conversationSourceTagsMenuCollapsed = ref<
      Record<string, SourceTagsMenuCollapsed>
    >(loadConversationSourceTagsMenuCollapsed());
    const conversationSourceTagsMenuAlwaysShow = ref<
      Record<string, SourceTagsMenuAlwaysShow>
    >(loadConversationSourceTagsMenuAlwaysShow());

    watch(sourceTagsMenuCollapsed, saveSourceTagsMenuCollapsed, { deep: true });
    watch(sourceTagsMenuAlwaysShow, saveSourceTagsMenuAlwaysShow, {
      deep: true,
    });
    watch(
      conversationSourceTagsMenuCollapsed,
      saveConversationSourceTagsMenuCollapsed,
      { deep: true },
    );
    watch(
      conversationSourceTagsMenuAlwaysShow,
      saveConversationSourceTagsMenuAlwaysShow,
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
