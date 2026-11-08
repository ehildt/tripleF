import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

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

function loadScrollMode(): ScrollMode {
  try {
    const saved = localStorage.getItem(SCROLL_MODE_KEY);
    return saved === 'native' ? 'native' : 'carousel';
  } catch {
    return 'carousel';
  }
}

function saveScrollMode(value: ScrollMode): void {
  try {
    localStorage.setItem(SCROLL_MODE_KEY, value);
  } catch {
    /* ignore */
  }
}

function loadConversationScrollModes(): Record<string, ScrollMode> {
  try {
    return JSON.parse(
      localStorage.getItem(CONVERSATION_SCROLL_MODE_KEY) || '{}',
    );
  } catch {
    return {};
  }
}

function saveConversationScrollModes(value: Record<string, ScrollMode>): void {
  try {
    localStorage.setItem(CONVERSATION_SCROLL_MODE_KEY, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

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

function saveChatIconVisibility(value: ChatIconVisibility): void {
  try {
    localStorage.setItem(CHAT_ICON_VISIBILITY_KEY, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export const useChatNavigationSettingsStore = defineStore(
  'chat-navigation-settings',
  () => {
    /** Global default every conversation inherits unless overridden. */
    const defaultScrollMode = ref<ScrollMode>(loadScrollMode());
    /** Per-conversation overrides keyed by conversation id. */
    const conversationScrollModes = ref<Record<string, ScrollMode>>(
      loadConversationScrollModes(),
    );
    /** Which action icons are shown on the user-prompt header and history. */
    const chatIconVisibility = ref<ChatIconVisibility>(
      loadChatIconVisibility(),
    );

    watch(defaultScrollMode, saveScrollMode);
    watch(conversationScrollModes, saveConversationScrollModes, { deep: true });
    watch(chatIconVisibility, saveChatIconVisibility, { deep: true });

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
