/**
 * Smoke test: mount the Chat orchestrator inside the app's 12-column
 * grid (the way the story now does) and assert that the toolbar
 * receives the left-positioning classes.
 *
 * Regression: Chat.stories.ts used to render the orchestrator on its
 * own. The toolbar relies on `lg:col-span-2 lg:col-start-1` classes
 * that only take effect inside a grid parent. Without that grid the
 * toolbar floated to the wrong side of the page.
 */
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, provide } from 'vue';

import type { SocketProvider } from '@/types/socket-provider.model';

import { appViewContextKey } from '../../composables/use-app-view-context';
import { mockAppViewContext } from '../../test-utils/mock-app-view-context';
import Chat from './Chat.vue';

function makeMockSocketProvider(): SocketProvider {
  return {
    getSocket: () => ({ connected: true, on: () => {}, off: () => {} }),
    joinRoom: () => {},
    listenToEvent: () => {},
    trackRequest: (
      _endpoint: string,
      _method: string,
      promise: Promise<Response>,
    ) => promise,
    addMessage: () => {},
    addPendingMessage: () => {},
    updatePendingMessage: () => {},
    connectedEvents: new Set<string>(),
    connectedRooms: new Map<string, Set<string>>(),
    closeEvent: () => {},
    closeRoom: () => {},
  };
}

function mountChatInsideGrid() {
  const pinia = createPinia();
  setActivePinia(pinia);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, enabled: false } },
  });

  const AppShell = defineComponent({
    setup() {
      provide('VUE_QUERY_CLIENT', queryClient);
      provide(
        appViewContextKey,
        mockAppViewContext({
          socketProvider: makeMockSocketProvider(),
        }),
      );
      return () =>
        h('div', { class: 'grid grid-cols-1 lg:grid-cols-12 gap-3' }, [
          h(Chat),
        ]);
    },
  });

  return mount(AppShell, {
    global: { plugins: [pinia, [VueQueryPlugin, { queryClient }]] },
  });
}

describe('Chat story smoke', () => {
  beforeEach(() => {
    localStorage.clear();
    // Chat.vue loads playlists on mount via fetch; Node's fetch rejects
    // relative URLs, so stub fetch to an empty success here.
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

  it('places the toolbar inside the app grid so lg:col-span-2 takes effect', () => {
    const wrapper = mountChatInsideGrid();
    const html = wrapper.html();
    // The toolbar is the first lg:col-span-2 child of the grid.
    expect(html).toMatch(/lg:col-span-2[^"]*lg:col-start-1/);
  });
});
