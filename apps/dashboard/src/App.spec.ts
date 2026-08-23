import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';

import App from './App.vue';

vi.mock('./stores/app', () => ({
  useAppStore: () => ({
    activeTab: 'chat',
    blinkLogo: false,
    requestId: 'req-id',
    refreshRequestId: vi.fn(),
    abortJob: vi.fn(),
    handleCopyToClipboard: vi.fn(),
    setActiveTab: vi.fn(),
    isTabVisible: () => true,
    tabVisibility: {},
    // Boot syncs the server-persisted memory ids (deferred to idle).
    syncMemoryPartitionFromServer: vi.fn(),
    syncMemoryCognitionFromServer: vi.fn(),
  }),
}));

vi.mock('./stores/debug', () => ({
  useDebugStore: () => ({
    debugLogCount: 0,
    debugResults: [],
    selectedDebugResult: null,
    addSocketDebugEntry: vi.fn(),
    clearDebugResults: vi.fn(),
  }),
}));

vi.mock('./stores/messages', () => ({
  useApiMessagesStore: () => ({
    completedCount: 0,
    messages: [],
    addMessage: vi.fn(),
    clearMessages: vi.fn(),
  }),
}));

vi.mock('./stores/models', () => ({
  useModelsStore: () => ({
    models: ['llama'],
    modelNames: ['llama'],
    localModels: [],
    cloudModels: [],
    numCtxOptions: [],
    formatCtx: (n: number) => String(n),
    modelsLoading: false,
    fetchModels: vi.fn(),
  }),
}));

vi.mock('./stores/socket', () => ({
  useSocketStore: () => ({
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

vi.mock('./stores/helpers/create-socket-provider.helper', () => ({
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
}));

vi.mock('./stores/theme', () => ({
  useThemeStore: () => ({
    currentTheme: 'souls',
    isDarkMode: true,
    initTheme: vi.fn(),
    toggleDarkMode: vi.fn(),
  }),
  THEMES: [
    { key: 'souls', name: 'Dark Souls', primary: '#e6a23c' },
    { key: 'residentevil', name: 'Resident Evil', primary: '#c0392b' },
  ],
}));

describe('App', () => {
  it('renders without crashing', () => {
    setActivePinia(createPinia());
    // App renders TabMenu (RouterLinks) and mirrors the route into the app
    // store, so a memory router must be installed.
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
