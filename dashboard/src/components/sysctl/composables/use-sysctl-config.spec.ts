import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useSysctlConfig } from './use-sysctl-config';

vi.mock('../../../composables/use-toast', () => ({
  useToast: vi.fn(() => ({ error: vi.fn(), success: vi.fn() })),
}));

const baseOllamaConnection = {
  host: 'http://localhost:11434/api',
  apiKey: 'ollama-key',
};

const baseSnapshot = {
  serper: {
    enabled: true,
    apiKey: 'serper-key',
    web: { enabled: true, results: 10 },
    images: { enabled: true, results: 10 },
    news: { enabled: true, results: 10 },
    places: { enabled: true, results: 10 },
    shopping: { enabled: true, results: 10 },
    reviews: { enabled: true, results: 10 },
    videos: { enabled: true, results: 10 },
    scrape: { enabled: true },
  },
  youtube: {
    enabled: true,
    apiKey: 'youtube-key',
    videos: { enabled: true, results: 10 },
  },
  brightData: {
    enabled: true,
    apiKey: 'bright-data-key',
    serpZone: 'serp_api',
    unlockerZone: 'unlocker',
    web: { enabled: true, results: 10 },
    images: { enabled: true, results: 10 },
    news: { enabled: true, results: 10 },
    places: { enabled: true, results: 10 },
    shopping: { enabled: true, results: 10 },
    videos: { enabled: true, results: 10 },
    scrape: { enabled: true },
  },
};

function mockFetchByUrl(configOverrides?: Record<string, unknown>) {
  return vi.fn(async (input: unknown, init?: { method?: string }) => {
    const url = String(input);
    if (url.includes('/api/v1/configs/')) {
      if (init?.method === 'PUT') {
        return { ok: true, status: 200, json: async () => ({}) };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ providerOverrides: configOverrides ?? {} }),
      };
    }
    if (url.includes('/api/v1/ollama-overrides')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ ...baseOllamaConnection }),
      };
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({
        ...baseSnapshot,
        serper: { ...baseSnapshot.serper },
      }),
    };
  });
}

describe('useSysctlConfig', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', mockFetchByUrl());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads config from the API on refresh', async () => {
    const { config, isLoading, refreshConfig } = useSysctlConfig();
    await refreshConfig();
    expect(isLoading.value).toBe(false);
    expect(config.value).toEqual(
      expect.objectContaining({
        serper: expect.objectContaining({ enabled: true }),
      }),
    );
  });

  it('applies server-persisted overrides on refresh', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchByUrl({ serper: { web: { enabled: false, results: 3 } } }),
    );
    const { config, refreshConfig } = useSysctlConfig();
    await refreshConfig();

    const web = config.value?.serper.web;
    expect(web?.enabled).toBe(false);
    expect(web?.results).toBe(3);
  });

  it('toggles provider enabled state and patches the server', async () => {
    const { config, refreshConfig, toggleProviderEnabled } = useSysctlConfig();
    await refreshConfig();
    toggleProviderEnabled('serper');
    expect(config.value?.serper.enabled).toBe(false);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/provider-overrides'),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ serper: { enabled: false } }),
      }),
    );
  });

  it('toggles endpoint enabled state and patches the full endpoint', async () => {
    const { config, refreshConfig, toggleEndpoint } = useSysctlConfig();
    await refreshConfig();
    toggleEndpoint('serper', 'web');
    expect(config.value?.serper.web.enabled).toBe(false);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/provider-overrides'),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({
          serper: {
            web: {
              enabled: false,
              results: 10,
            },
          },
        }),
      }),
    );
  });

  it('updates endpoint results and clamps the value', async () => {
    const { config, refreshConfig, updateEndpointResults } = useSysctlConfig();
    await refreshConfig();
    updateEndpointResults('serper', 'web', '250');
    expect(config.value?.serper.web.results).toBe(200);
    updateEndpointResults('serper', 'web', '-5');
    expect(config.value?.serper.web.results).toBe(1);
  });

  it('does not mutate an endpoint that lacks results', async () => {
    const { config, refreshConfig, updateEndpointResults } = useSysctlConfig();
    await refreshConfig();
    updateEndpointResults('serper', 'scrape', '50');
    expect(config.value?.serper.scrape).toEqual({ enabled: true });
  });

  it('loads the ollama connection from its own overrides API', async () => {
    const { config, refreshConfig } = useSysctlConfig();
    await refreshConfig();
    expect(config.value?.ollama).toEqual(baseOllamaConnection);
  });

  it('saves the ollama API key against the ollama overrides API', async () => {
    const { refreshConfig, updateApiKey } = useSysctlConfig();
    await refreshConfig();
    const saved = await updateApiKey('ollama', 'new-ollama-key');
    expect(saved).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/ollama-overrides'),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ apiKey: 'new-ollama-key' }),
      }),
    );
  });

  it('patches the ollama host against the ollama overrides API', async () => {
    const { refreshConfig, patchConfig } = useSysctlConfig();
    await refreshConfig();
    await patchConfig('ollama', 'host', 'https://ollama.com/api');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/ollama-overrides'),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ host: 'https://ollama.com/api' }),
      }),
    );
  });

  it('resets the ollama connection without a provider path suffix', async () => {
    const { refreshConfig, resetProvider } = useSysctlConfig();
    await refreshConfig();
    await resetProvider('ollama');
    const deleteCalls = (fetch as ReturnType<typeof vi.fn>).mock.calls.filter(
      ([, init]) => (init as { method?: string })?.method === 'DELETE',
    );
    expect(deleteCalls[0]?.[0]).toEqual(
      expect.stringMatching(/\/api\/v1\/ollama-overrides$/),
    );
  });
});
