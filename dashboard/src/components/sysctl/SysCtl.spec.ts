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
        searxng: { status: 'ok' },
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
  brave: {
    enabled: true,
    apiKey: 'brave-key',
    web: { enabled: true, results: 10 },
    images: { enabled: true, results: 10 },
    news: { enabled: true, results: 10 },
    video: { enabled: true, results: 10 },
  },
  searxng: { url: 'https://search.local', enabled: true, results: 10 },
  browserBase: {
    enabled: false,
    apiKey: undefined,
    projectId: undefined,
    search: { enabled: false, results: 10 },
    fetch: { enabled: false, format: 'markdown', proxies: false },
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

  it('renders the Search Engine header with selected provider', async () => {
    const wrapper = mountPanel();
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Search Engine :: Serper');
    });
  });

  it('renders provider selector buttons for all providers', async () => {
    const wrapper = mountPanel();
    await vi.waitFor(() => {
      const buttons = wrapper.findAll('.provider-selector__button');
      expect(buttons.length).toBe(4);
    });
  });

  it('shows only the selected provider switch cards', async () => {
    const wrapper = mountPanel();
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('enabled');
    });
    expect(wrapper.text()).not.toContain('Brave');
    expect(wrapper.text()).not.toContain('SearXNG');
    expect(wrapper.text()).not.toContain('Browserbase');
  });

  it('switches to the selected provider when a selector button is clicked', async () => {
    const wrapper = mountPanel();
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Serper');
    });

    const buttons = wrapper.findAll('.provider-selector__button');
    await buttons[2]?.trigger('click');
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('SearXNG');
    });
  });

  it('renders tab visibility section with dlq', async () => {
    const wrapper = mountPanel();
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Tab Visibility');
      expect(wrapper.text()).toContain('dlq');
    });
  });

  it('renders system health and tab visibility as their own panels', async () => {
    const wrapper = mountPanel();
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('System Health');
      expect(wrapper.text()).toContain('Tab Visibility');
    });
    const panels = wrapper.findAll('.sysctl-panels > div');
    expect(panels.length).toBeGreaterThanOrEqual(3);
  });
});
