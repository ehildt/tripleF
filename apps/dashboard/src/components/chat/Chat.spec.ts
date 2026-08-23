import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

import { appViewContextKey } from '../../composables/use-app-view-context';
import { mockAppViewContext } from '../../test-utils/mock-app-view-context';
import type { SocketProvider } from '../../types/socket-provider.model';

vi.mock('../../composables/use-socket-subscription', () => ({
  useSocketSubscription: () => ({
    isEventConnected: ref(true),
    isRoomConnected: ref(true),
  }),
}));

vi.mock('./composables/use-submit', () => ({
  useSubmit: () => ({
    arguments_: ref(''),
    submit: vi.fn(),
    persistArguments: vi.fn(),
  }),
}));

vi.mock('../../composables/use-chat-think', () => ({
  useChatThink: () => ({
    filteredThinkOptions: ref([]),
    selectThink: vi.fn(),
  }),
}));

vi.mock('../../composables/use-chat-context-size', () => ({
  useChatContextSize: () => ({
    filteredContextSizeOptions: ref([]),
    defaultContextSize: ref('4096'),
    selectContextSize: vi.fn(),
  }),
}));

vi.mock('../../composables/use-chat-input', () => ({
  useChatInput: () => ({
    onCollapsedKeydown: vi.fn(),
    onPromptInput: vi.fn(),
  }),
}));

vi.mock('./composables/use-chat-conversation', () => ({
  useChatConversation: () => ({
    conversationId: ref(''),
    conversation: ref(null),
    selectedModelObj: ref(null),
    userExchanges: ref([]),
    messageListItems: ref([]),
  }),
}));

vi.mock('./composables/use-chat-panel', () => ({
  useChatPanel: () => ({
    rightPanelView: ref('files'),
    selectPanelView: vi.fn(),
  }),
}));

vi.mock('./composables/use-chat-dropdowns', () => ({
  useChatDropdowns: () => ({
    setThinkDropdownRef: vi.fn(),
    setContextSizeDropdownRef: vi.fn(),
    onThinkOpen: vi.fn(),
    onContextSizeOpen: vi.fn(),
  }),
}));

vi.mock('./composables/use-chat-actions', () => ({
  useChatActions: () => ({
    onPromptClick: vi.fn(),
    triggerFileSelect: vi.fn(),
    onRemoveAttachedFile: vi.fn(),
    onToggleAttachedFileSelected: vi.fn(),
  }),
}));

import Chat from './Chat.vue';

let activePinia: ReturnType<typeof createPinia>;

function makeSocketProvider(): SocketProvider {
  return {
    getSocket: vi.fn(),
    trackRequest: vi.fn(
      (_endpoint: string, _method: string, promise: Promise<Response>) =>
        promise,
    ),
    addMessage: vi.fn(),
    addPendingMessage: vi.fn(),
    updatePendingMessage: vi.fn(),
    connectedEvents: new Set<string>(),
    connectedRooms: new Map<string, Set<string>>(),
    closeEvent: vi.fn(),
    closeRoom: vi.fn(),
  };
}

function mountChat() {
  return mount(Chat, {
    global: {
      plugins: [activePinia],
      provide: {
        [appViewContextKey]: mockAppViewContext({
          socketProvider: makeSocketProvider(),
        }),
      },
    },
  });
}

describe('Chat', () => {
  beforeEach(() => {
    activePinia = createPinia();
    setActivePinia(activePinia);
    // Chat.vue loads playlists on mount via fetch; Node's fetch (undici)
    // rejects relative URLs, so stub fetch to an empty success here.
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue({ ok: true, status: 200, json: async () => [] }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the prompt input textarea', () => {
    const wrapper = mountChat();
    expect(wrapper.find('textarea').exists()).toBe(true);
  });

  it('renders without crashing when no conversation is active', () => {
    const wrapper = mountChat();
    expect(wrapper.html()).toBeTruthy();
  });
});
