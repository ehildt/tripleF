import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ToolDependencies } from '../types/tool-dependencies.types.js';

import { createSerperBusinessReviewsSearch } from './business-reviews-search.tool.js';

const ENDPOINT = 'https://google.serper.dev/reviews';

const buildDeps = (overrides: { enabled?: boolean; reviewsEnabled?: boolean } = {}): ToolDependencies =>
  ({
    logger: { log: vi.fn(), warn: vi.fn(), debug: vi.fn(), error: vi.fn() },
    getLiveConfig: () => ({
      serper: {
        enabled: overrides.enabled ?? true,
        apiKey: 'test-key',
        reviews: { enabled: overrides.reviewsEnabled ?? true, results: 3 },
      },
    }),
  }) as unknown as ToolDependencies;

const execute = (deps: ToolDependencies, input: Record<string, unknown>) =>
  (createSerperBusinessReviewsSearch(deps).execute as any)(input);

const mockFetch = (response: { ok?: boolean; status?: number; body?: unknown }) =>
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: response.ok ?? true,
    status: response.status ?? 200,
    json: async () => response.body ?? {},
  } as Response);

describe('createSerperBusinessReviewsSearch', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('short-circuits when reviews are disabled', async () => {
    const fetchMock = mockFetch({ body: {} });

    const result = await execute(buildDeps({ reviewsEnabled: false }), { query: 'MediaMarkt Berlin' });

    expect(result).toEqual({ results: [], error: 'Serper.dev reviews is not enabled' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('requires a placeId, cid or business name', async () => {
    const fetchMock = mockFetch({ body: {} });

    const result = await execute(buildDeps(), { query: '   ' });

    expect(result).toEqual({ results: [], error: 'Provide a placeId, cid, or business name query' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('looks a business up by placeId when one is supplied', async () => {
    const fetchMock = mockFetch({ body: { reviews: [] } });

    await execute(buildDeps(), { placeId: 'place-1', cid: 'cid-1', query: 'ignored' });

    const body = JSON.parse(fetchMock.mock.calls[0][1]!.body as string);
    expect(body.placeId).toBe('place-1');
    expect(body).not.toHaveProperty('cid');
    expect(body).not.toHaveProperty('q');
  });

  it('falls back to the cid when no placeId is supplied', async () => {
    const fetchMock = mockFetch({ body: { reviews: [] } });

    await execute(buildDeps(), { cid: 'cid-1', query: 'ignored' });

    const body = JSON.parse(fetchMock.mock.calls[0][1]!.body as string);
    expect(body.cid).toBe('cid-1');
    expect(body).not.toHaveProperty('q');
  });

  it('trims and sends the business name when no identifiers are supplied', async () => {
    const deps = buildDeps();
    const fetchMock = mockFetch({ body: { reviews: [] } });

    await execute(deps, { query: '  MediaMarkt Berlin  ', lang: 'de' });

    const body = JSON.parse(fetchMock.mock.calls[0][1]!.body as string);
    expect(body.q).toBe('MediaMarkt Berlin');
    expect(body.hl).toBe('de');
    expect(deps.logger.log).toHaveBeenCalledWith('Serper.dev Reviews search for "MediaMarkt Berlin"');
  });

  it('uses the cid as the lookup label when only a cid is given', async () => {
    const deps = buildDeps();
    mockFetch({ body: { reviews: [] } });

    await execute(deps, { cid: 'cid-1' });

    expect(deps.logger.log).toHaveBeenCalledWith('Serper.dev Reviews search for "cid-1"');
  });

  it('reports the HTTP status when Serper fails', async () => {
    const fetchMock = mockFetch({ ok: false, status: 403 });

    const result = await execute(buildDeps(), { query: 'MediaMarkt Berlin' });

    expect(fetchMock.mock.calls[0][0]).toBe(ENDPOINT);
    expect(result).toEqual({ results: [], error: 'HTTP 403' });
  });

  it('returns no results for an empty review list', async () => {
    const deps = buildDeps();
    mockFetch({ body: { reviews: [] } });

    const result = await execute(deps, { query: 'MediaMarkt Berlin' });

    expect(result).toEqual({ results: [] });
    expect(deps.logger.warn).toHaveBeenCalledWith('Serper.dev Reviews returned 0 results for "MediaMarkt Berlin"');
  });

  it('maps reviews with the place name from placeInfo', async () => {
    mockFetch({
      body: {
        placeInfo: { title: 'MediaMarkt Berlin', address: 'Alexanderplatz 1', rating: 4.1, ratingCount: 900 },
        reviews: [
          {
            user: { name: 'Ada' },
            snippet: 'Great service',
            rating: 5,
            isoDate: '2025-01-02',
            date: '2 months ago',
            likes: 4,
          },
          { snippet: 'Slow checkout', rating: 2, date: 'last week' },
        ],
      },
    });

    const result = await execute(buildDeps(), { query: 'MediaMarkt Berlin' });

    expect(result.results).toEqual([
      {
        author: 'Ada',
        snippet: 'Great service',
        rating: 5,
        date: '2025-01-02',
        likes: 4,
        place: 'MediaMarkt Berlin',
      },
      {
        author: '',
        snippet: 'Slow checkout',
        rating: 2,
        date: 'last week',
        likes: 0,
        place: 'MediaMarkt Berlin',
      },
    ]);
    expect(result.place).toEqual({
      title: 'MediaMarkt Berlin',
      address: 'Alexanderplatz 1',
      rating: 4.1,
      ratingCount: 900,
    });
  });

  it('omits the place block when placeInfo is absent', async () => {
    mockFetch({ body: { reviews: [{ snippet: 'Fine', rating: 3 }] } });

    const result = await execute(buildDeps(), { query: 'MediaMarkt Berlin' });

    expect(result.place).toBeUndefined();
    expect(result.results[0].place).toBe('');
  });

  it('defaults a place block with missing fields to empty strings', async () => {
    mockFetch({ body: { placeInfo: {}, reviews: [{ snippet: 'Fine', rating: 3 }] } });

    const result = await execute(buildDeps(), { query: 'MediaMarkt Berlin' });

    expect(result.place).toEqual({ title: '', address: '', rating: undefined, ratingCount: undefined });
  });
});
