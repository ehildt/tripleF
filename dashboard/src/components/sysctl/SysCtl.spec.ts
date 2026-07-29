import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Component } from 'vue';
import { ref } from 'vue';

import SysCtl from './SysCtl.vue';

vi.mock('../../composables/use-toast', () => ({
  useToast: vi.fn(() => ({ error: vi.fn() })),
}));

vi.mock('../../api/queries/use-health-ready.query', () => ({
  useHealthReady: vi.fn(() => ({
    data: ref({
      info: {
        disk: { status: 'up' },
        ollama: { status: 'up' },
        memory_heap: { status: 'up' },
        memory_rss: { status: 'up' },
        postgres: { status: 'up' },
        minio: { status: 'up' },
      },
      details: {},
      error: {},
    }),
    isLoading: ref(false),
    isError: ref(false),
  })),
}));

const baseConfig = {
  serper: {
    enabled: true,
    apiKey: 'serper-key',
    web: { enabled: true, results: 10 },
    images: { enabled: true, results: 10 },
    news: { enabled: true, results: 10 },
    places: { enabled: false, results: 5 },
    shopping: { enabled: false, results: 5 },
    reviews: { enabled: false, results: 5 },
    videos: { enabled: false, results: 5 },
    webpageFetch: { enabled: true },
  },
};

function mockFetch(config = baseConfig) {
  return vi.fn(async () => ({
    ok: true,
    json: async () => config,
  }));
}

describe('SysCtl', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.stubGlobal('fetch', mockFetch());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function mountPanel() {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return mount(SysCtl as Component, {
      global: {
        plugins: [createPinia(), [VueQueryPlugin, { queryClient }]],
      },
    });
  }

  async function selectMenuTab(
    wrapper: ReturnType<typeof mountPanel>,
    label: string,
  ) {
    const tab = wrapper
      .findAll('.sysctl-menu__tab')
      .find((button) => button.text() === label);
    await tab?.trigger('click');
  }

  it('opens on the search engines tab by default', async () => {
    const wrapper = mountPanel();
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('SysCtl :: Search Engines');
    });
  });

  it('renders the serper provider section with its endpoints', async () => {
    const wrapper = mountPanel();
    await vi.waitFor(() => {
      expect(wrapper.find('button[aria-label="Enable Serper"]').exists()).toBe(
        true,
      );
      expect(wrapper.text()).toContain('web');
      expect(wrapper.text()).toContain('images');
    });
  });

  it('shows the interface switches inside the system tab', async () => {
    const wrapper = mountPanel();
    await selectMenuTab(wrapper, 'System');

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('SysCtl :: System');
      expect(wrapper.text()).toContain('sockets');
      expect(wrapper.text()).toContain('counters');
    });
  });

  it('shows the tab menu switches inside the widgets tab', async () => {
    const wrapper = mountPanel();
    await selectMenuTab(wrapper, 'Widgets');

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('SysCtl :: Widgets');
      expect(wrapper.text()).toContain('dlq');
      expect(wrapper.text()).toContain('debug');
      expect(wrapper.text()).toContain('side');
      expect(wrapper.text()).toContain('autoclose');
    });
  });

  it('shows the health tiles on the system tab', async () => {
    const wrapper = mountPanel();
    await selectMenuTab(wrapper, 'System');

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('SysCtl :: System');
      expect(wrapper.text()).toContain('disk');
    });
  });

  it('remembers the selected tab across remounts', async () => {
    const wrapper = mountPanel();
    await selectMenuTab(wrapper, 'System');
    wrapper.unmount();

    const remounted = mountPanel();
    await vi.waitFor(() => {
      expect(remounted.text()).toContain('SysCtl :: System');
    });
  });
});
