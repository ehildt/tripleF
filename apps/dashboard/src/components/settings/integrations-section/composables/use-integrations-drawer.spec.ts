import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Ref } from 'vue';
import { ref } from 'vue';

import type {
  EndpointConfig,
  ProviderOverridesSnapshot,
  SerperConfig,
  YouTubeConfig,
} from '../../settings-config.model';
import { useIntegrationsDrawer } from './use-integrations-drawer';

const OFF: EndpointConfig = { enabled: false, results: 0 };

function makeSnapshot(
  overrides: Partial<{
    serper: Partial<SerperConfig>;
    youtube: Partial<YouTubeConfig>;
  }> = {},
): ProviderOverridesSnapshot {
  return {
    serper: {
      enabled: true,
      web: OFF,
      images: OFF,
      news: OFF,
      places: OFF,
      shopping: OFF,
      reviews: OFF,
      videos: OFF,
      scrape: { enabled: false },
      ...overrides.serper,
    },
    brightData: {
      enabled: false,
      web: OFF,
      images: OFF,
      news: OFF,
      places: OFF,
      shopping: OFF,
      videos: OFF,
      scrape: { enabled: false },
    },
    youtube: { enabled: false, videos: OFF, ...overrides.youtube },
    sources: { preferred: [], blocked: [], imageTaskReferenceCount: 4 },
    ollama: { host: 'https://ollama.local' },
    eodhd: {
      enabled: true,
      search: OFF,
      quote: OFF,
      history: OFF,
      technical: OFF,
      intraday: OFF,
      news: OFF,
      fundamentals: OFF,
    },
  };
}

describe('useIntegrationsDrawer', () => {
  let config: Ref<ProviderOverridesSnapshot | null>;
  let toggleProviderEnabled: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    config = ref(makeSnapshot());
    toggleProviderEnabled = vi.fn();
  });

  it('builds a tile per registered integration with translated labels', () => {
    const { tiles } = useIntegrationsDrawer(config, toggleProviderEnabled);

    expect(tiles.value).toHaveLength(5);
    const serper = tiles.value.find((tile) => tile.meta.id === 'serper');
    expect(serper?.name).toBe('Serper');
    expect(serper?.enabled).toBe(true);
    expect(serper?.configured).toBe(false);
    expect(serper?.openLabel).toBe('Open Serper configuration');
  });

  it('opens the drawer for an integration and closes it again', () => {
    const {
      drawerOpen,
      drawerIntegration,
      drawerTitle,
      openIntegration,
      closeIntegration,
      onDrawerClosed,
    } = useIntegrationsDrawer(config, toggleProviderEnabled);

    openIntegration('serper');
    expect(drawerOpen.value).toBe(true);
    expect(drawerIntegration.value).toBe('serper');
    expect(drawerTitle.value).toBe('Serper');

    closeIntegration();
    expect(drawerOpen.value).toBe(false);
    // The body stays mounted for the leave transition, dropped after it.
    expect(drawerIntegration.value).toBe('serper');
    onDrawerClosed();
    expect(drawerIntegration.value).toBeNull();
  });

  it('quick-toggle opens the drawer instead when enabling without credentials', () => {
    config.value = makeSnapshot({ serper: { enabled: false } });
    const { drawerOpen, drawerIntegration, toggleIntegration } =
      useIntegrationsDrawer(config, toggleProviderEnabled);

    toggleIntegration('serper');

    expect(toggleProviderEnabled).not.toHaveBeenCalled();
    expect(drawerOpen.value).toBe(true);
    expect(drawerIntegration.value).toBe('serper');
  });

  it('quick-toggle flips a configured integration instantly', () => {
    config.value = makeSnapshot({
      serper: { enabled: false, apiKey: 'sk-123' },
    });
    const { drawerOpen, toggleIntegration } = useIntegrationsDrawer(
      config,
      toggleProviderEnabled,
    );

    toggleIntegration('serper');

    expect(toggleProviderEnabled).toHaveBeenCalledWith('serper');
    expect(drawerOpen.value).toBe(false);
  });

  it('does not quick-toggle a non-toggleable integration', () => {
    const { toggleIntegration } = useIntegrationsDrawer(
      config,
      toggleProviderEnabled,
    );

    toggleIntegration('sources');

    expect(toggleProviderEnabled).not.toHaveBeenCalled();
  });
});
