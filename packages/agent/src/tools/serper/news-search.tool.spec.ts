import { afterEach, describe, expect, it, vi } from 'vitest';

import { isGoogleGotoLink } from '../helpers/is-google-goto-link.helper.js';
import type { ToolDependencies } from '../types/tool-dependencies.types.js';

import { createSerperNewsSearch } from './news-search.tool.js';

const ENDPOINT = 'https://google.serper.dev/news';

const buildDeps = (overrides: { enabled?: boolean; newsEnabled?: boolean; results?: number } = {}): ToolDependencies =>
  ({
    logger: { log: vi.fn(), warn: vi.fn(), debug: vi.fn(), error: vi.fn() },
    getLiveConfig: () => ({
      serper: {
        enabled: overrides.enabled ?? true,
        apiKey: 'test-key',
        news: { enabled: overrides.newsEnabled ?? true, results: overrides.results ?? 3 },
      },
    }),
  }) as unknown as ToolDependencies;

const execute = (deps: ToolDependencies, input: Record<string, unknown>) =>
  (createSerperNewsSearch(deps).execute as any)(input);

const mockFetch = (response: { ok?: boolean; body?: unknown }) =>
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: response.ok ?? true,
    status: 200,
    json: async () => response.body ?? {},
  } as Response);

describe('createSerperNewsSearch', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('short-circuits when news is disabled', async () => {
    const fetchMock = mockFetch({ body: {} });

    const result = await execute(buildDeps({ newsEnabled: false }), { query: 'markets' });

    expect(result).toEqual({ results: [], error: 'Serper.dev news is not enabled' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('uses the configured count when the caller omits one', async () => {
    const fetchMock = mockFetch({ body: { news: [] } });

    await execute(buildDeps({ results: 2 }), { query: 'markets' });

    expect(JSON.parse(fetchMock.mock.calls[0][1]!.body as string).num).toBe(2);
  });

  it('never exceeds the configured count or the ranked-search cap', async () => {
    const deps = buildDeps({ results: 2 });
    const fetchMock = mockFetch({ body: { news: [] } });

    await execute(deps, { query: 'markets', count: 10 });

    expect(JSON.parse(fetchMock.mock.calls[0][1]!.body as string).num).toBe(2);
    expect(deps.logger.warn).toHaveBeenCalledWith(
      'Serper.dev news results clamped to 3 (top-3 rank cutoff) for "markets"',
    );
  });

  it('caps the configured count when it exceeds the ranked-search cap', async () => {
    const fetchMock = mockFetch({ body: { news: [] } });

    await execute(buildDeps({ results: 10 }), { query: 'markets' });

    expect(JSON.parse(fetchMock.mock.calls[0][1]!.body as string).num).toBe(3);
  });

  it('sends locale and recency filters', async () => {
    const fetchMock = mockFetch({ body: { news: [] } });

    await execute(buildDeps(), { query: 'markets', lang: 'en', recency: 'day' });

    expect(fetchMock.mock.calls[0][0]).toBe(ENDPOINT);
    expect(JSON.parse(fetchMock.mock.calls[0][1]!.body as string)).toMatchObject({
      q: 'markets',
      hl: 'en',
      tbs: 'qdr:d',
    });
  });

  it('returns no results on an HTTP error', async () => {
    mockFetch({ ok: false });

    await expect(execute(buildDeps(), { query: 'markets' })).resolves.toEqual({ results: [] });
  });

  it('returns no results for an empty or missing news list', async () => {
    mockFetch({ body: { news: [] } });
    await expect(execute(buildDeps(), { query: 'markets' })).resolves.toEqual({ results: [] });

    mockFetch({ body: {} });
    await expect(execute(buildDeps(), { query: 'markets' })).resolves.toEqual({ results: [] });
  });

  it('maps headlines with source, date and image', async () => {
    mockFetch({
      body: {
        news: [
          {
            title: 'Markets rally',
            link: 'https://example.com/a',
            snippet: 'stocks up',
            source: 'Example News',
            date: '2 hours ago',
            imageUrl: 'https://example.com/a.jpg',
          },
        ],
      },
    });

    const result = await execute(buildDeps(), { query: 'markets' });

    expect(result.results).toEqual([
      {
        title: 'Markets rally',
        snippet: 'stocks up',
        url: 'https://example.com/a',
        source: 'Example News',
        date: '2 hours ago',
        imageUrl: 'https://example.com/a.jpg',
      },
    ]);
  });

  it('defaults missing headline metadata to empty strings', async () => {
    mockFetch({
      body: { news: [{ title: 'Bare', link: 'https://example.com/b' }] },
    });

    const result = await execute(buildDeps(), { query: 'markets' });

    expect(result.results[0]).toMatchObject({ snippet: '', source: '', date: '', imageUrl: '' });
  });

  it('drops google.com/goto wrappers from news results', async () => {
    const deps = buildDeps();
    mockFetch({
      body: {
        news: [
          { title: 'Real', link: 'https://example.com/real' },
          { title: 'Wrapper', link: 'https://www.google.com/goto?url=CAES' },
        ],
      },
    });

    const result = await execute(deps, { query: 'markets' });

    expect(result.results.map((r: { url: string }) => r.url)).toEqual(['https://example.com/real']);
    expect(result.results.some((r: { url: string }) => isGoogleGotoLink(r.url))).toBe(false);
    expect(deps.logger.warn).toHaveBeenCalledWith(
      'Serper.dev dropped 1 unresolved google.com/goto link(s) for "markets"',
    );
  });
});
