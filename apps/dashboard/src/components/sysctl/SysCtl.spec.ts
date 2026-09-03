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

// The system tab mounts the memory panels, which read the cognition
// snapshot and the fact partition through the real @/api/memory.api module.
// The spec's global fetch stub returns the provider-overrides config shape,
// so the memory reads are mocked here to return their documented empty
// states.
vi.mock('@/api/memory.api', () => ({
  fetchMemoryCognition: vi.fn(async () => ({
    profile: null,
    insights: [],
    convictions: [],
  })),
  fetchMemoryFacts: vi.fn(async () => []),
  wipeMemoryCognition: vi.fn(async () => 0),
  wipeMemoryFacts: vi.fn(async () => 0),
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
    scrape: { enabled: true },
  },
  youtube: {
    enabled: true,
    apiKey: 'youtube-key',
    videos: { enabled: true, results: 6 },
  },
  brightData: {
    enabled: true,
    apiKey: 'bright-data-key',
    serpZone: 'serp_api',
    unlockerZone: 'unlocker',
    web: { enabled: true, results: 10 },
    images: { enabled: true, results: 10 },
    news: { enabled: true, results: 10 },
    places: { enabled: false, results: 5 },
    shopping: { enabled: false, results: 5 },
    videos: { enabled: false, results: 5 },
    scrape: { enabled: true },
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
      .find((button) => button.attributes('aria-label') === label);
    await tab?.trigger('click');
  }

  async function selectSubMenuTab(
    wrapper: ReturnType<typeof mountPanel>,
    label: string,
  ) {
    const tab = wrapper
      .findAll('.sysctl-submenu__tab')
      .find((button) => button.attributes('aria-label') === label);
    await tab?.trigger('click');
  }

  it('opens on the integrations tab by default', async () => {
    const wrapper = mountPanel();
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Integrations');
    });
  });

  it('shows a tile per integration with its state-colored toggle', async () => {
    const wrapper = mountPanel();
    await vi.waitFor(() => {
      const tiles = wrapper.findAll('.integration-tile__surface');
      expect(tiles.length).toBeGreaterThanOrEqual(5);
      expect(wrapper.text()).toContain('Serper');
      // The mock config has an enabled serper with an API key → green toggle.
      expect(wrapper.find('.integration-tile--ok').exists()).toBe(true);
      expect(wrapper.find('button[aria-label="Enable Serper"]').exists()).toBe(
        true,
      );
    });
  });

  it('opens the serper drawer with its endpoints when the tile is clicked', async () => {
    const wrapper = mountPanel();
    await vi.waitFor(() => {
      expect(wrapper.find('.integration-tile__surface').exists()).toBe(true);
    });

    const serperTile = wrapper
      .findAll('.integration-tile__surface')
      .find(
        (tile) => tile.attributes('aria-label') === 'Open Serper configuration',
      );
    await serperTile?.trigger('click');

    // The drawer is teleported to <body>, outside the wrapper subtree.
    await vi.waitFor(() => {
      expect(
        document.body.querySelector('input[name="serper-api-key"]'),
      ).not.toBeNull();
      expect(document.body.textContent).toContain('Web');
      expect(document.body.textContent).toContain('Images');
    });
  });

  it('shows the interface switches inside the interface tab', async () => {
    const wrapper = mountPanel();
    await selectMenuTab(wrapper, 'Interface');

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Interface');
      expect(wrapper.text()).toContain('Sockets');
      expect(wrapper.text()).toContain('Always show the source menu');
      expect(wrapper.text()).toContain('Always show the view menu');
    });
  });

  it('shows the tab menu switches inside the widgets tab', async () => {
    const wrapper = mountPanel();
    await selectMenuTab(wrapper, 'Widgets');
    await vi.waitFor(() => {
      expect(wrapper.findAll('.sysctl-submenu__tab').length).toBeGreaterThan(0);
    });
    await selectSubMenuTab(wrapper, 'Tab menu');

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Widgets');
      expect(wrapper.text()).toContain('Memory');
      expect(wrapper.text()).toContain('Dead letter');
      expect(wrapper.text()).toContain('Debug');
      expect(wrapper.text()).toContain('Counters');
      expect(wrapper.text()).toContain('Side');
      expect(wrapper.text()).toContain('Auto-close');
    });
  });

  it('shows the health tiles on the system tab', async () => {
    const wrapper = mountPanel();
    await selectMenuTab(wrapper, 'System');

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('System');
      expect(wrapper.text()).toContain('disk');
    });
  });

  it('remembers the selected tab across remounts', async () => {
    const wrapper = mountPanel();
    await selectMenuTab(wrapper, 'System');
    wrapper.unmount();

    const remounted = mountPanel();
    await vi.waitFor(() => {
      expect(remounted.text()).toContain('System');
    });
  });
});
