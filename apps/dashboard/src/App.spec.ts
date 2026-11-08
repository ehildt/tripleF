import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';

import App from './App.vue';

vi.mock('./stores/debug/debug.store', () => ({
  useDebugStore: () => ({
    debugLogCount: 0,
    debugResults: [],
    addDebugResult: vi.fn(),
    clearDebugResults: vi.fn(),
  }),
}));

vi.mock('./stores/messages/messages.store', () => ({
  useMessagesStore: () => ({
    completedCount: 0,
    messages: [],
    addMessage: vi.fn(),
    clearMessages: vi.fn(),
  }),
}));

vi.mock('./stores/models/models.store', () => ({
  useModelsStore: () => ({
    models: ['llama'],
    modelNames: ['llama'],
    localModels: [],
    cloudModels: [],
    numCtxOptions: [],
    formatContextSize: (n: number) => String(n),
    modelsLoading: false,
    fetchModels: vi.fn(),
  }),
}));

vi.mock('@/components/app/composables/use-dlq-live-events', () => ({
  useDlqLiveEvents: vi.fn(),
}));

vi.mock('@/composables/use-socket/use-socket', () => ({
  useSocket: () => ({
    connectionState: 'disconnected',
    socketId: '',
    connectedEvents: new Set(),
    connectedRooms: new Map(),
    connectedPairs: [],
    setCallbacks: vi.fn(),
    getSocket: vi.fn(() => ({ connected: false })),
    trackRequest: vi.fn(),
    addPendingMessage: vi.fn(),
    closeEvent: vi.fn(),
    closeRoom: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    subscribeToEvent: vi.fn(),
    ensureSocketConnection: vi.fn(),
  }),
}));

vi.mock(
  '@/components/chat/composables/helpers/create-socket-provider.helper',
  () => ({
    createSocketProvider: () => ({
      getSocket: vi.fn(() => ({ connected: false })),
      trackRequest: vi.fn(),
      addPendingMessage: vi.fn(),
      closeEvent: vi.fn(),
      closeRoom: vi.fn(),
      connect: vi.fn(),
      disconnect: vi.fn(),
      subscribeToEvent: vi.fn(),
    }),
  }),
);

vi.mock('./composables/use-theme/use-theme', () => ({
  useTheme: () => ({
    currentTheme: ref('souls'),
    isDarkMode: ref(true),
    initTheme: vi.fn(),
    toggleDarkMode: vi.fn(),
  }),
}));

// App.vue boots the playlist store, which fetches playlists over HTTP. Stub
// the api module so that boot fetch resolves empty instead of hitting a real
// URL in jsdom.
vi.mock('@/api/playlists.api', () => ({
  fetchAllPlaylists: vi.fn(async () => []),
  savePlaylist: vi.fn(async () => {}),
  renamePlaylist: vi.fn(async () => {}),
  deletePlaylist: vi.fn(async () => {}),
}));

vi.mock('./components/chat/composables/use-conversation-catalog', () => ({
  useConversationCatalog: () => ({
    watchActiveConversationBookmark: vi.fn(),
    bootstrapConversations: vi.fn(async () => {}),
  }),
}));

describe('App', () => {
  it('renders without crashing', () => {
    setActivePinia(createPinia());
    // App renders TabMenu RouterLinks and derives navigation from the route,
    // so a memory router must be installed.
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/:pathMatch(.*)*',
          name: 'chat',
          component: { template: '<div />' },
        },
      ],
    });
    const wrapper = mount(App, { global: { plugins: [router] } });
    expect(wrapper.find('header').exists()).toBe(true);
    expect(wrapper.find('main').exists()).toBe(true);
  });
});
