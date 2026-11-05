import { afterEach, describe, expect, it, vi } from 'vitest';

import { SEARCH_API_RESULTS_CAP } from '../constants/search-results-cap.constant.js';
import { isGoogleGotoLink } from '../helpers/is-google-goto-link.helper.js';
import type { ToolDependencies } from '../types/tool-dependencies.types.js';

import { createSerperWebSearch } from './web-search.tool.js';

const ENDPOINT = 'https://google.serper.dev/search';

const buildDeps = (
  overrides: {
    enabled?: boolean;
    apiKey?: string;
    webEnabled?: boolean;
    results?: number;
    defaultLang?: string;
  } = {},
): ToolDependencies =>
  ({
    logger: { log: vi.fn(), warn: vi.fn(), debug: vi.fn(), error: vi.fn() },
    defaultLang: overrides.defaultLang,
    getLiveConfig: () => ({
      serper: {
        enabled: overrides.enabled ?? true,
        apiKey: 'apiKey' in overrides ? overrides.apiKey : 'test-key',
        web: { enabled: overrides.webEnabled ?? true, results: overrides.results ?? 3 },
      },
    }),
  }) as unknown as ToolDependencies;

const execute = (deps: ToolDependencies, input: Record<string, unknown>) =>
  (createSerperWebSearch(deps).execute as any)(input);

const mockFetch = (response: { ok?: boolean; status?: number; body?: unknown }) =>
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: response.ok ?? true,
    status: response.status ?? 200,
    json: async () => response.body ?? {},
  } as Response);

describe('createSerperWebSearch', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('short-circuits with an error when the provider is disabled', async () => {
    const fetchMock = mockFetch({ body: {} });

    const result = await execute(buildDeps({ enabled: false }), { query: 'cats' });

    expect(result).toEqual({ results: [], error: 'Serper.dev web search is not enabled' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('short-circuits when the API key is missing', async () => {
    const fetchMock = mockFetch({ body: {} });

    const result = await execute(buildDeps({ apiKey: undefined }), { query: 'cats' });

    expect(result.error).toBe('Serper.dev web search is not enabled');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('short-circuits when the web endpoint is disabled', async () => {
    const fetchMock = mockFetch({ body: {} });

    const result = await execute(buildDeps({ webEnabled: false }), { query: 'cats' });

    expect(result.error).toBe('Serper.dev web search is not enabled');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('clamps the requested result count to the ranked-search cap', async () => {
    const deps = buildDeps({ results: 10 });
    const fetchMock = mockFetch({ body: { organic: [] } });

    await execute(deps, { query: 'cats' });

    const body = JSON.parse(fetchMock.mock.calls[0][1]!.body as string);
    expect(body.num).toBe(SEARCH_API_RESULTS_CAP);
    expect(deps.logger.warn).toHaveBeenCalledWith(expect.stringContaining('clamped from 10 to 3'));
  });

  it('does not warn when the configured count is already within the cap', async () => {
    const deps = buildDeps({ results: 2 });
    mockFetch({ body: { organic: [] } });

    await execute(deps, { query: 'cats' });

    expect(deps.logger.warn).not.toHaveBeenCalledWith(expect.stringContaining('clamped'));
  });

  it('applies the caller locale and recency to the request body', async () => {
    const fetchMock = mockFetch({ body: { organic: [] } });

    await execute(buildDeps(), { query: 'cats', lang: 'de', recency: 'week' });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(ENDPOINT);
    expect(init!.method).toBe('POST');
    expect((init!.headers as Record<string, string>)['X-API-KEY']).toBe('test-key');
    const body = JSON.parse(init!.body as string);
    expect(body).toMatchObject({ q: 'cats', hl: 'de', tbs: 'qdr:w' });
  });

  it('falls back to the dependency default language', async () => {
    const fetchMock = mockFetch({ body: { organic: [] } });

    await execute(buildDeps({ defaultLang: 'ja' }), { query: 'cats' });

    expect(JSON.parse(fetchMock.mock.calls[0][1]!.body as string).hl).toBe('ja');
  });

  it('returns no results when Serper answers with an error status', async () => {
    const deps = buildDeps();
    mockFetch({ ok: false, status: 503 });

    const result = await execute(deps, { query: 'cats' });

    expect(result).toEqual({ results: [] });
    expect(deps.logger.warn).toHaveBeenCalledWith('Serper.dev returned 503 for "cats"');
  });

  it('returns no results when the organic list is empty', async () => {
    const deps = buildDeps();
    mockFetch({ body: { organic: [] } });

    const result = await execute(deps, { query: 'cats' });

    expect(result).toEqual({ results: [] });
    expect(deps.logger.warn).toHaveBeenCalledWith('Serper.dev returned 0 results for "cats"');
  });

  it('returns no results when the response omits the organic list', async () => {
    mockFetch({ body: {} });

    await expect(execute(buildDeps(), { query: 'cats' })).resolves.toEqual({ results: [] });
  });

  it('maps organic results and keeps resolvable links', async () => {
    const deps = buildDeps();
    mockFetch({
      body: {
        organic: [
          { title: 'Cats', link: 'https://example.com/cats', snippet: 'about cats' },
          { title: 'Dogs', link: 'https://example.com/dogs' },
        ],
      },
    });

    const result = await execute(deps, { query: 'pets' });

    expect(result.results).toEqual([
      { title: 'Cats', snippet: 'about cats', url: 'https://example.com/cats', source: 'serper' },
      { title: 'Dogs', snippet: '', url: 'https://example.com/dogs', source: 'serper' },
    ]);
    expect(deps.logger.log).toHaveBeenCalledWith('Serper.dev returned 2 results for "pets"');
  });

  it('drops unresolved google.com/goto wrappers and reports the count', async () => {
    const deps = buildDeps();
    const wrapper = 'https://www.google.com/goto?url=CAESabc';
    mockFetch({
      body: {
        organic: [
          { title: 'Real', link: 'https://example.com/real' },
          { title: 'Wrapper', link: wrapper },
        ],
      },
    });

    const result = await execute(deps, { query: 'pets' });

    expect(result.results.map((r: { url: string }) => r.url)).toEqual(['https://example.com/real']);
    expect(result.results.some((r: { url: string }) => isGoogleGotoLink(r.url))).toBe(false);
    expect(deps.logger.warn).toHaveBeenCalledWith('Serper.dev dropped 1 unresolved google.com/goto link(s) for "pets"');
  });

  it('logs the search it is about to run', async () => {
    const deps = buildDeps();
    mockFetch({ body: { organic: [] } });

    await execute(deps, { query: 'cats' });

    expect(deps.logger.log).toHaveBeenCalledWith('Serper.dev search for "cats"');
  });
});
