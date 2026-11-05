import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ToolDependencies } from '../types/tool-dependencies.types.js';

import { createSerperPlacesSearch } from './places-search.tool.js';

const ENDPOINT = 'https://google.serper.dev/places';

const buildDeps = (
  overrides: { enabled?: boolean; placesEnabled?: boolean; results?: number } = {},
): ToolDependencies =>
  ({
    logger: { log: vi.fn(), warn: vi.fn(), debug: vi.fn(), error: vi.fn() },
    getLiveConfig: () => ({
      serper: {
        enabled: overrides.enabled ?? true,
        apiKey: 'test-key',
        places: { enabled: overrides.placesEnabled ?? true, results: overrides.results ?? 3 },
      },
    }),
  }) as unknown as ToolDependencies;

const execute = (deps: ToolDependencies, input: Record<string, unknown>) =>
  (createSerperPlacesSearch(deps).execute as any)(input);

const mockFetch = (response: { ok?: boolean; status?: number; body?: unknown }) =>
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: response.ok ?? true,
    status: response.status ?? 200,
    json: async () => response.body ?? {},
  } as Response);

describe('createSerperPlacesSearch', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('short-circuits when places is disabled', async () => {
    const fetchMock = mockFetch({ body: {} });

    const result = await execute(buildDeps({ placesEnabled: false }), { query: 'MediaMarkt Berlin' });

    expect(result).toEqual({ results: [], error: 'Serper.dev places is not enabled' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('clamps a caller count above the configured maximum', async () => {
    const deps = buildDeps({ results: 2 });
    const fetchMock = mockFetch({ body: { places: [] } });

    await execute(deps, { query: 'MediaMarkt Berlin', count: 5 });

    expect(JSON.parse(fetchMock.mock.calls[0][1]!.body as string).num).toBe(2);
    expect(deps.logger.warn).toHaveBeenCalledWith(
      'Serper.dev places results clamped to 3 (top-3 rank cutoff) for "MediaMarkt Berlin"',
    );
  });

  it('does not warn when no clamping happens', async () => {
    const deps = buildDeps({ results: 1 });
    mockFetch({ body: { places: [] } });

    await execute(deps, { query: 'MediaMarkt Berlin' });

    expect(deps.logger.warn).not.toHaveBeenCalledWith(expect.stringContaining('clamped'));
  });

  it('sends the locale and the maps query', async () => {
    const fetchMock = mockFetch({ body: { places: [] } });

    await execute(buildDeps(), { query: 'MediaMarkt Berlin', lang: 'de' });

    expect(fetchMock.mock.calls[0][0]).toBe(ENDPOINT);
    expect(JSON.parse(fetchMock.mock.calls[0][1]!.body as string)).toMatchObject({
      q: 'MediaMarkt Berlin',
      hl: 'de',
      gl: 'de',
    });
  });

  it('reports the HTTP status when Serper fails', async () => {
    mockFetch({ ok: false, status: 500 });

    await expect(execute(buildDeps(), { query: 'MediaMarkt Berlin' })).resolves.toEqual({
      results: [],
      error: 'HTTP 500',
    });
  });

  it('returns no results for an empty places list', async () => {
    const deps = buildDeps();
    mockFetch({ body: { places: [] } });

    const result = await execute(deps, { query: 'MediaMarkt Berlin' });

    expect(result).toEqual({ results: [] });
    expect(deps.logger.warn).toHaveBeenCalledWith('Serper.dev Places returned 0 results for "MediaMarkt Berlin"');
  });

  it('maps a place with all fields', async () => {
    mockFetch({
      body: {
        places: [
          {
            title: 'MediaMarkt',
            address: 'Alexanderplatz 1, Berlin',
            phoneNumber: '+49 30 123',
            latitude: 52.52,
            longitude: 13.41,
            rating: 4.1,
            ratingCount: 900,
            type: 'Electronics store',
            website: 'https://www.mediamarkt.de',
            cid: '123456',
          },
        ],
      },
    });

    const result = await execute(buildDeps(), { query: 'MediaMarkt Berlin' });

    expect(result.results).toEqual([
      {
        title: 'MediaMarkt',
        address: 'Alexanderplatz 1, Berlin',
        phoneNumber: '+49 30 123',
        latitude: 52.52,
        longitude: 13.41,
        rating: 4.1,
        ratingCount: 900,
        type: 'Electronics store',
        website: 'https://www.mediamarkt.de',
        cid: '123456',
      },
    ]);
  });

  it('defaults missing place metadata to empty values', async () => {
    mockFetch({ body: { places: [{ title: 'Bare place' }] } });

    const result = await execute(buildDeps(), { query: 'Bare place' });

    expect(result.results[0]).toMatchObject({
      address: '',
      phoneNumber: '',
      type: '',
      website: '',
      cid: '',
    });
  });
});
