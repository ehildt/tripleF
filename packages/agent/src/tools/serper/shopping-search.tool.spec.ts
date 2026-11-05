import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ToolDependencies } from '../types/tool-dependencies.types.js';

import { createSerperShoppingSearch } from './shopping-search.tool.js';

const ENDPOINT = 'https://google.serper.dev/shopping';

const buildDeps = (
  overrides: { enabled?: boolean; shoppingEnabled?: boolean; results?: number } = {},
): ToolDependencies =>
  ({
    logger: { log: vi.fn(), warn: vi.fn(), debug: vi.fn(), error: vi.fn() },
    getLiveConfig: () => ({
      serper: {
        enabled: overrides.enabled ?? true,
        apiKey: 'test-key',
        shopping: { enabled: overrides.shoppingEnabled ?? true, results: overrides.results ?? 3 },
      },
    }),
  }) as unknown as ToolDependencies;

const execute = (deps: ToolDependencies, input: Record<string, unknown>) =>
  (createSerperShoppingSearch(deps).execute as any)(input);

const mockFetch = (response: { ok?: boolean; status?: number; body?: unknown }) =>
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: response.ok ?? true,
    status: response.status ?? 200,
    json: async () => response.body ?? {},
  } as Response);

describe('createSerperShoppingSearch', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('short-circuits when shopping is disabled', async () => {
    const fetchMock = mockFetch({ body: {} });

    const result = await execute(buildDeps({ shoppingEnabled: false }), { query: 'Sony WH-1000XM5' });

    expect(result).toEqual({ results: [], error: 'Serper.dev shopping is not enabled' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('short-circuits when the provider is disabled', async () => {
    const fetchMock = mockFetch({ body: {} });

    const result = await execute(buildDeps({ enabled: false }), { query: 'Sony WH-1000XM5' });

    expect(result.error).toBe('Serper.dev shopping is not enabled');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('clamps a caller count above the configured maximum', async () => {
    const deps = buildDeps({ results: 2 });
    const fetchMock = mockFetch({ body: { shopping: [] } });

    await execute(deps, { query: 'Sony WH-1000XM5', count: 10 });

    expect(JSON.parse(fetchMock.mock.calls[0][1]!.body as string).num).toBe(2);
    expect(deps.logger.warn).toHaveBeenCalledWith(
      'Serper.dev shopping results clamped to 3 (top-3 rank cutoff) for "Sony WH-1000XM5"',
    );
  });

  it('sends the locale and the product query', async () => {
    const fetchMock = mockFetch({ body: { shopping: [] } });

    await execute(buildDeps(), { query: 'Sony WH-1000XM5', lang: 'de' });

    expect(fetchMock.mock.calls[0][0]).toBe(ENDPOINT);
    expect(JSON.parse(fetchMock.mock.calls[0][1]!.body as string)).toMatchObject({
      q: 'Sony WH-1000XM5',
      hl: 'de',
    });
  });

  it('reports the HTTP status when Serper fails', async () => {
    mockFetch({ ok: false, status: 429 });

    await expect(execute(buildDeps(), { query: 'Sony WH-1000XM5' })).resolves.toEqual({
      results: [],
      error: 'HTTP 429',
    });
  });

  it('returns no results for an empty shopping list', async () => {
    const deps = buildDeps();
    mockFetch({ body: { shopping: [] } });

    const result = await execute(deps, { query: 'Sony WH-1000XM5' });

    expect(result).toEqual({ results: [] });
    expect(deps.logger.warn).toHaveBeenCalledWith('Serper.dev Shopping returned 0 results for "Sony WH-1000XM5"');
  });

  it('maps offers and leaves merchant links untouched', async () => {
    const fetchMock = mockFetch({
      body: {
        shopping: [
          {
            title: 'Sony WH-1000XM5',
            link: 'https://www.mediamarkt.de/de/product/wh1000xm5',
            price: '€349.00',
            source: 'MediaMarkt',
            delivery: 'Free',
            rating: 4.6,
            ratingCount: 1200,
          },
        ],
      },
    });

    const result = await execute(buildDeps(), { query: 'Sony WH-1000XM5' });

    expect(result.results).toEqual([
      {
        title: 'Sony WH-1000XM5',
        price: '€349.00',
        link: 'https://www.mediamarkt.de/de/product/wh1000xm5',
        source: 'MediaMarkt',
        imageUrl: '',
        delivery: 'Free',
        rating: 4.6,
        ratingCount: 1200,
      },
    ]);
    // Only the shopping endpoint was hit — no merchant-link resolution needed.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('defaults missing offer metadata to empty values', async () => {
    mockFetch({
      body: { shopping: [{ title: 'Bare', link: 'https://shop.example/p', price: '', source: '' }] },
    });

    const result = await execute(buildDeps(), { query: 'Bare' });

    expect(result.results[0]).toMatchObject({ imageUrl: '', delivery: '' });
  });
});
