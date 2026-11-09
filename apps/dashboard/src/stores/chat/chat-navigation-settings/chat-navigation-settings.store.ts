import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

import { parseChatIconVisibility } from './helpers/parse-chat-icon-visibility.helper';
import { parseConversationScrollModes } from './helpers/parse-conversation-scroll-modes.helper';
import { parseScrollMode } from './helpers/parse-scroll-mode.helper';
import {
  CHAT_ICON_VISIBILITY_KEY,
  CONVERSATION_SCROLL_MODE_KEY,
  DEFAULT_CHAT_ICON_VISIBILITY,
  SCROLL_MODE_KEY,
} from './chat-navigation-settings.constant';
import type {
  ChatIconKey,
  ChatIconVisibility,
  ScrollMode,
} from './chat-navigation-settings.model';

export const useChatNavigationSettingsStore = defineStore(
  'chat-navigation-settings',
  () => {
    /** Global default every conversation inherits unless overridden. */
    const defaultScrollMode = ref<ScrollMode>('carousel');
    try {
      defaultScrollMode.value = parseScrollMode(
        localStorage.getItem(SCROLL_MODE_KEY),
      );
    } catch {
      /* Storage unavailable: retain the carousel default. */
    }

    /** Per-conversation overrides keyed by conversation id. */
    const conversationScrollModes = ref<Record<string, ScrollMode>>({});
    try {
      conversationScrollModes.value = parseConversationScrollModes(
        localStorage.getItem(CONVERSATION_SCROLL_MODE_KEY),
      );
    } catch {
      /* Storage unavailable: retain no overrides. */
    }

    /** Action icons shown on the user-prompt header and history. */
    const chatIconVisibility = ref<ChatIconVisibility>({
      ...DEFAULT_CHAT_ICON_VISIBILITY,
    });
    try {
      chatIconVisibility.value = parseChatIconVisibility(
        localStorage.getItem(CHAT_ICON_VISIBILITY_KEY),
      );
    } catch {
      /* Storage unavailable: retain the visibility defaults. */
    }

    watch(defaultScrollMode, (value) => {
      try {
        localStorage.setItem(SCROLL_MODE_KEY, value);
      } catch {
        /* Storage unavailable: retain the preference in memory. */
      }
    });
    watch(
      conversationScrollModes,
      (value) => {
        try {
          localStorage.setItem(
            CONVERSATION_SCROLL_MODE_KEY,
            JSON.stringify(value),
          );
        } catch {
          /* Storage unavailable: retain overrides in memory. */
        }
      },
      { deep: true },
    );
    watch(
      chatIconVisibility,
      (value) => {
        try {
          localStorage.setItem(CHAT_ICON_VISIBILITY_KEY, JSON.stringify(value));
        } catch {
          /* Storage unavailable: retain visibility in memory. */
        }
      },
      { deep: true },
    );

    function setDefaultScrollMode(mode: ScrollMode): void {
      defaultScrollMode.value = mode;
    }

    function getConversationScrollMode(conversationId: string): ScrollMode {
      return (
        conversationScrollModes.value[conversationId] ?? defaultScrollMode.value
      );
    }

    function setConversationScrollMode(
      conversationId: string,
      mode: ScrollMode,
    ): void {
      conversationScrollModes.value[conversationId] = mode;
    }

    function setChatIconVisibility(key: ChatIconKey, value: boolean): void {
      chatIconVisibility.value[key] = value;
    }

    return {
      defaultScrollMode,
      conversationScrollModes,
      chatIconVisibility,
      setDefaultScrollMode,
      getConversationScrollMode,
      setConversationScrollMode,
      setChatIconVisibility,
    };
  },
);
