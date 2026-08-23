import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useSearchEngineAvailability } from './use-search-engine-availability';

vi.mock('../../../composables/use-toast', () => ({
  useToast: vi.fn(() => ({ error: vi.fn(), success: vi.fn() })),
}));

function mockFetchByUrl(options: {
  serper?: {
    enabled?: boolean;
    apiKey?: string;
  } & Record<string, unknown>;
  brightData?: {
    enabled?: boolean;
    apiKey?: string;
  } & Record<string, unknown>;
  youtube?: {
    enabled?: boolean;
    apiKey?: string;
  } & Record<string, unknown>;
  sessionOverrides?: Record<string, unknown>;
  providerOverridesOk?: boolean;
}) {
  return vi.fn(async (input: unknown, init?: { method?: string }) => {
    const url = String(input);
    if (url.includes('/api/v1/configs/')) {
      if (init?.method === 'PUT') {
        return { ok: true, status: 200, json: async () => ({}) };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          providerOverrides: options.sessionOverrides ?? {},
        }),
      };
    }
    if (init?.method === 'PUT') {
      return options.providerOverridesOk === false
        ? { ok: false, status: 500, json: async () => ({}) }
        : { ok: true, status: 200, json: async () => ({}) };
    }
    if (options.providerOverridesOk === false) {
      return { ok: false, status: 500, json: async () => ({}) };
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({
        serper: options.serper ?? {},
        brightData: options.brightData ?? {},
        youtube: options.youtube ?? {},
      }),
    };
  });
}

async function createLoaded(
  options: Parameters<typeof mockFetchByUrl>[0],
): Promise<ReturnType<typeof useSearchEngineAvailability>> {
  vi.stubGlobal('fetch', mockFetchByUrl(options));
  const availability = useSearchEngineAvailability();
  await availability.refresh();
  return availability;
}

describe('useSearchEngineAvailability', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts unknown until the config is loaded', () => {
    vi.stubGlobal('fetch', mockFetchByUrl({}));
    const { searchEngineState } = useSearchEngineAvailability();
    expect(searchEngineState.value).toBe('unknown');
  });

  it('reports enabled when serper is enabled with an API key', async () => {
    const { searchEngineState } = await createLoaded({
      serper: { enabled: true, apiKey: 'abcd****wxyz' },
    });
    expect(searchEngineState.value).toBe('enabled');
  });

  it('reports disabled when serper is off but an API key exists', async () => {
    const { searchEngineState } = await createLoaded({
      serper: { enabled: false, apiKey: 'abcd****wxyz' },
    });
    expect(searchEngineState.value).toBe('disabled');
  });

  it('reports unavailable when no API key is configured', async () => {
    const { searchEngineState } = await createLoaded({
      serper: { enabled: true },
    });
    expect(searchEngineState.value).toBe('unavailable');
  });

  it('lets the session-persisted enabled override win over the snapshot', async () => {
    const { searchEngineState } = await createLoaded({
      serper: { enabled: false, apiKey: 'abcd****wxyz' },
      sessionOverrides: { serper: { enabled: true } },
    });
    expect(searchEngineState.value).toBe('enabled');
  });

  it('stays unknown when the provider-overrides fetch fails', async () => {
    const { searchEngineState } = await createLoaded({
      providerOverridesOk: false,
    });
    expect(searchEngineState.value).toBe('unknown');
  });

  it('stays unknown when the request rejects', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down');
      }),
    );
    const { searchEngineState, refresh } = useSearchEngineAvailability();
    await refresh();
    expect(searchEngineState.value).toBe('unknown');
  });

  it('kills the search engine on toggle and persists server + session', async () => {
    const fetchMock = mockFetchByUrl({
      serper: { enabled: true, apiKey: 'abcd****wxyz' },
    });
    vi.stubGlobal('fetch', fetchMock);
    const { searchEngineState, refresh, toggleSearchEngine } =
      useSearchEngineAvailability();
    await refresh();

    await toggleSearchEngine();

    expect(searchEngineState.value).toBe('disabled');
    const putCalls = fetchMock.mock.calls.filter(
      ([, init]) => (init as { method?: string })?.method === 'PUT',
    );
    const bodies = putCalls.map(([url, init]) => ({
      url: String(url),
      body: JSON.parse(String((init as { body?: string }).body)),
    }));
    expect(bodies).toContainEqual(
      expect.objectContaining({ body: { serper: { enabled: false } } }),
    );
    expect(
      bodies.some(
        (call) =>
          call.url.includes('/api/v1/configs/') &&
          call.body.providerOverrides?.serper?.enabled === false,
      ),
    ).toBe(true);
  });

  it('re-enables the search engine when toggled after a kill', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchByUrl({
        serper: { enabled: false, apiKey: 'abcd****wxyz' },
      }),
    );
    const { searchEngineState, refresh, toggleSearchEngine } =
      useSearchEngineAvailability();
    await refresh();
    expect(searchEngineState.value).toBe('disabled');

    await toggleSearchEngine();

    expect(searchEngineState.value).toBe('enabled');
  });

  it('reverts the state when the server write fails', async () => {
    let failWrites = false;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: unknown, init?: { method?: string }) => {
        const url = String(input);
        if (init?.method === 'PUT' && failWrites) {
          return { ok: false, status: 500, json: async () => ({}) };
        }
        if (url.includes('/api/v1/configs/')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({ providerOverrides: {} }),
          };
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({
            serper: { enabled: true, apiKey: 'abcd****wxyz' },
          }),
        };
      }),
    );
    const { searchEngineState, refresh, toggleSearchEngine } =
      useSearchEngineAvailability();
    await refresh();
    expect(searchEngineState.value).toBe('enabled');

    failWrites = true;
    await toggleSearchEngine();

    expect(searchEngineState.value).toBe('enabled');
  });

  it('does nothing when toggled while unavailable or unknown', async () => {
    const fetchMock = mockFetchByUrl({ serper: { enabled: true } });
    vi.stubGlobal('fetch', fetchMock);
    const { refresh, toggleSearchEngine } = useSearchEngineAvailability();
    await refresh();

    await toggleSearchEngine();

    expect(
      fetchMock.mock.calls.filter(
        ([, init]) => (init as { method?: string })?.method === 'PUT',
      ),
    ).toHaveLength(0);
  });

  it('toggleSource disables a source and writes both stores', async () => {
    const fetchMock = mockFetchByUrl({
      serper: {
        enabled: true,
        apiKey: 'abcd****wxyz',
        web: { enabled: true },
        news: { enabled: true },
      },
    });
    vi.stubGlobal('fetch', fetchMock);
    const { searchSources, refresh, toggleSource } =
      useSearchEngineAvailability();
    await refresh();
    expect(searchSources.value.map((entry) => entry.key)).toEqual([
      'web',
      'news',
    ]);

    await toggleSource('news');

    expect(
      searchSources.value.find((entry) => entry.key === 'news')?.enabled,
    ).toBe(false);
    const puts = fetchMock.mock.calls.filter(
      ([, init]) => (init as { method?: string })?.method === 'PUT',
    );
    expect(
      puts.some(([, init]) =>
        String((init as { body?: string }).body).includes(
          '"news":{"enabled":false}',
        ),
      ),
    ).toBe(true);
  });

  it('toggleSource re-enables a source disabled by a session override', async () => {
    const fetchMock = mockFetchByUrl({
      serper: {
        enabled: true,
        apiKey: 'abcd****wxyz',
        web: { enabled: true },
        news: { enabled: true },
      },
      sessionOverrides: { serper: { news: { enabled: false } } },
    });
    vi.stubGlobal('fetch', fetchMock);
    const { searchSources, refresh, toggleSource } =
      useSearchEngineAvailability();
    await refresh();
    expect(
      searchSources.value.find((entry) => entry.key === 'news')?.enabled,
    ).toBe(false);

    await toggleSource('news');

    expect(
      searchSources.value.find((entry) => entry.key === 'news')?.enabled,
    ).toBe(true);
    expect(
      fetchMock.mock.calls.some(([, init]) =>
        String((init as { body?: string })?.body ?? '').includes(
          '"news":{"enabled":true}',
        ),
      ),
    ).toBe(true);
  });

  it('rolls the source toggle back when the write fails', async () => {
    let failWrites = false;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: unknown, init?: { method?: string }) => {
        const url = String(input);
        if (url.includes('/api/v1/configs/')) {
          if (init?.method === 'PUT') {
            return failWrites
              ? { ok: false, status: 500, json: async () => ({}) }
              : { ok: true, status: 200, json: async () => ({}) };
          }
          return {
            ok: true,
            status: 200,
            json: async () => ({ providerOverrides: {} }),
          };
        }
        if (init?.method === 'PUT') {
          return failWrites
            ? { ok: false, status: 500, json: async () => ({}) }
            : { ok: true, status: 200, json: async () => ({}) };
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({
            serper: {
              enabled: true,
              apiKey: 'abcd****wxyz',
              web: { enabled: true },
              news: { enabled: true },
            },
          }),
        };
      }),
    );
    const { searchSources, refresh, toggleSource } =
      useSearchEngineAvailability();
    await refresh();
    expect(searchSources.value.map((entry) => entry.key)).toEqual([
      'web',
      'news',
    ]);

    failWrites = true;
    await toggleSource('news');

    expect(
      searchSources.value.find((entry) => entry.key === 'news')?.enabled,
    ).toBe(true);
  });

  it('treats a non-serper engine as available when it has an API key', async () => {
    const { searchEngineState } = await createLoaded({
      brightData: { enabled: true, apiKey: 'bd****masked' },
    });
    expect(searchEngineState.value).toBe('enabled');
  });

  it('reports unavailable when no engine has an API key', async () => {
    const { searchEngineState } = await createLoaded({
      serper: { enabled: true },
      brightData: { enabled: true },
      youtube: { enabled: true },
    });
    expect(searchEngineState.value).toBe('unavailable');
  });

  it('reports enabled when any configured engine is on and disabled when all are off', async () => {
    const { searchEngineState, refresh } = await createLoaded({
      serper: { enabled: false, apiKey: 's****masked' },
      brightData: { enabled: true, apiKey: 'bd****masked' },
      youtube: { enabled: false, apiKey: 'yt****masked' },
    });
    expect(searchEngineState.value).toBe('enabled');

    vi.stubGlobal(
      'fetch',
      mockFetchByUrl({
        serper: { enabled: false, apiKey: 's****masked' },
        brightData: { enabled: false, apiKey: 'bd****masked' },
        youtube: { enabled: false, apiKey: 'yt****masked' },
      }),
    );
    await refresh();
    expect(searchEngineState.value).toBe('disabled');
  });

  it('kill switch toggles every configured engine in server and session writes', async () => {
    const fetchMock = mockFetchByUrl({
      serper: { enabled: true, apiKey: 's****masked' },
      brightData: { enabled: true, apiKey: 'bd****masked' },
      youtube: { enabled: true, apiKey: 'yt****masked' },
    });
    vi.stubGlobal('fetch', fetchMock);
    const { searchEngineState, refresh, toggleSearchEngine } =
      useSearchEngineAvailability();
    await refresh();
    expect(searchEngineState.value).toBe('enabled');

    await toggleSearchEngine();

    expect(searchEngineState.value).toBe('disabled');
    const putBodies = fetchMock.mock.calls
      .filter(([, init]) => (init as { method?: string })?.method === 'PUT')
      .map(([url, init]) => ({
        url: String(url),
        body: JSON.parse(String((init as { body?: string }).body)),
      }));
    // Server write flips all three engines off.
    expect(
      putBodies.some(
        (call) =>
          !call.url.includes('/api/v1/configs/') &&
          call.body.serper?.enabled === false &&
          call.body.brightData?.enabled === false &&
          call.body.youtube?.enabled === false,
      ),
    ).toBe(true);
    // Session write mirrors all three engines off.
    expect(
      putBodies.some(
        (call) =>
          call.url.includes('/api/v1/configs/') &&
          call.body.providerOverrides?.serper?.enabled === false &&
          call.body.providerOverrides?.brightData?.enabled === false &&
          call.body.providerOverrides?.youtube?.enabled === false,
      ),
    ).toBe(true);
  });

  it('re-enabling after a kill flips every configured engine back on', async () => {
    const fetchMock = mockFetchByUrl({
      serper: { enabled: false, apiKey: 's****masked' },
      brightData: { enabled: false, apiKey: 'bd****masked' },
      youtube: { enabled: false, apiKey: 'yt****masked' },
    });
    vi.stubGlobal('fetch', fetchMock);
    const { searchEngineState, refresh, toggleSearchEngine } =
      useSearchEngineAvailability();
    await refresh();
    expect(searchEngineState.value).toBe('disabled');

    await toggleSearchEngine();

    expect(searchEngineState.value).toBe('enabled');
    const putBodies = fetchMock.mock.calls
      .filter(([, init]) => (init as { method?: string })?.method === 'PUT')
      .map(([url, init]) => ({
        url: String(url),
        body: JSON.parse(String((init as { body?: string }).body)),
      }));
    expect(
      putBodies.some(
        (call) =>
          !call.url.includes('/api/v1/configs/') &&
          call.body.serper?.enabled === true &&
          call.body.brightData?.enabled === true &&
          call.body.youtube?.enabled === true,
      ),
    ).toBe(true);
  });

  it('only toggles engines that are configured (no key means skipped)', async () => {
    const fetchMock = mockFetchByUrl({
      serper: { enabled: true, apiKey: 's****masked' },
      brightData: { enabled: true, apiKey: 'bd****masked' },
      // youtube has no key — not configured, must be left out of the write.
      youtube: { enabled: true },
    });
    vi.stubGlobal('fetch', fetchMock);
    const { refresh, toggleSearchEngine } = useSearchEngineAvailability();
    await refresh();
    expect(
      fetchMock.mock.calls.some(
        ([, init]) => (init as { method?: string })?.method === 'PUT',
      ),
    ).toBe(false);

    await toggleSearchEngine();

    const putBodies = fetchMock.mock.calls
      .filter(([, init]) => (init as { method?: string })?.method === 'PUT')
      .map(([url, init]) => ({
        url: String(url),
        body: JSON.parse(String((init as { body?: string }).body)),
      }));
    const serverPut = putBodies.find(
      (call) => !call.url.includes('/api/v1/configs/'),
    );
    expect(serverPut?.body.serper?.enabled).toBe(false);
    expect(serverPut?.body.brightData?.enabled).toBe(false);
    expect(serverPut?.body.youtube).toBeUndefined();
  });
});
