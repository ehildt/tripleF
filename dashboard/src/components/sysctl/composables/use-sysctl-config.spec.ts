import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useSysctlConfig } from './use-sysctl-config';

vi.mock('../../../composables/use-toast', () => ({
  useToast: vi.fn(() => ({ error: vi.fn() })),
}));

const baseSnapshot = {
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

function mockFetch(response: unknown, ok = true) {
  return vi.fn(async () => ({
    ok,
    json: async () => response,
  }));
}

describe('useSysctlConfig', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal(
      'fetch',
      mockFetch({ ...baseSnapshot, serper: { ...baseSnapshot.serper } }),
    );
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

  it('applies saved overrides and syncs them to the server', async () => {
    localStorage.setItem(
      'provider-overrides',
      JSON.stringify({ serper: { web: { enabled: false, results: 3 } } }),
    );
    const { config, refreshConfig } = useSysctlConfig();
    await refreshConfig();
    const web = config.value?.serper.web;
    expect(web?.enabled).toBe(false);
    expect(web?.results).toBe(3);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/provider-overrides'),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({
          serper: { web: { enabled: false, results: 3 } },
        }),
      }),
    );
  });

  it('toggles provider enabled state and patches the server', async () => {
    const { config, refreshConfig, toggleProviderEnabled } = useSysctlConfig();
    await refreshConfig();
    toggleProviderEnabled('serper');
    expect(config.value?.serper.enabled).toBe(false);
    expect(fetch).toHaveBeenLastCalledWith(
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
    expect(fetch).toHaveBeenLastCalledWith(
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
    updateEndpointResults('serper', 'webpageFetch', '50');
    expect(config.value?.serper.webpageFetch).toEqual({ enabled: true });
  });
});
