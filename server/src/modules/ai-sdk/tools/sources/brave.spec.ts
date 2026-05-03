import { describe, expect, it, vi } from 'vitest';

import { createBraveImageSearch } from './brave.js';

describe('createBraveImageSearch', () => {
  const mockDeps = () =>
    ({
      logger: { log: vi.fn(), warn: vi.fn() },
      getLiveConfig: () => ({
        brave: {
          enabled: true,
          apiKey: 'test-key',
          images: { enabled: true, results: 10 },
        },
      }),
    }) as any;

  it('filters results below the 720p minimum', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          {
            title: 'hd',
            image_url: 'https://example.com/hd.jpg',
            width: 1920,
            height: 1080,
          },
          {
            title: 'below-width',
            image_url: 'https://example.com/narrow.jpg',
            width: 1024,
            height: 768,
          },
          {
            title: 'below-height',
            image_url: 'https://example.com/short.jpg',
            width: 1920,
            height: 600,
          },
          {
            title: 'tiny',
            image_url: 'https://example.com/tiny.jpg',
            width: 640,
            height: 480,
          },
        ],
      }),
    } as any);

    const tool = createBraveImageSearch(mockDeps());
    const result = await (tool.execute as any)({ query: 'stellar blade' });

    expect(result.results).toHaveLength(1);
    expect(result.results[0].imageUrl).toBe('https://example.com/hd.jpg');

    fetchSpy.mockRestore();
  });

  it('keeps results with unknown dimensions', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          {
            title: 'no-dims',
            image_url: 'https://example.com/nodims.jpg',
          },
        ],
      }),
    } as any);

    const tool = createBraveImageSearch(mockDeps());
    const result = await (tool.execute as any)({ query: 'stellar blade' });

    expect(result.results).toHaveLength(1);
    expect(result.results[0].imageUrl).toBe('https://example.com/nodims.jpg');

    fetchSpy.mockRestore();
  });

  it('returns empty results when API returns nothing', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ results: [] }),
    } as any);

    const tool = createBraveImageSearch(mockDeps());
    const result = await (tool.execute as any)({ query: 'stellar blade' });

    expect(result.results).toHaveLength(0);

    fetchSpy.mockRestore();
  });

  it('filters results below an explicit high-resolution request', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          {
            title: '1080p',
            image_url: 'https://example.com/1080p.jpg',
            width: 1920,
            height: 1080,
          },
          {
            title: '1440p',
            image_url: 'https://example.com/1440p.jpg',
            width: 2560,
            height: 1440,
          },
        ],
      }),
    } as any);

    const tool = createBraveImageSearch(mockDeps());
    const result = await (tool.execute as any)({
      query: 'stellar blade',
      minWidth: 2560,
      minHeight: 1440,
    });

    expect(result.results).toHaveLength(1);
    expect(result.results[0].imageUrl).toBe('https://example.com/1440p.jpg');

    fetchSpy.mockRestore();
  });

  it('floors requests below 720p to the 720p minimum', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          {
            title: 'hd',
            image_url: 'https://example.com/hd.jpg',
            width: 1920,
            height: 1080,
          },
          {
            title: 'below-720p',
            image_url: 'https://example.com/small.jpg',
            width: 1024,
            height: 768,
          },
        ],
      }),
    } as any);

    const tool = createBraveImageSearch(mockDeps());
    const result = await (tool.execute as any)({
      query: 'stellar blade',
      minWidth: 640,
      minHeight: 480,
    });

    expect(result.results).toHaveLength(1);
    expect(result.results[0].imageUrl).toBe('https://example.com/hd.jpg');

    fetchSpy.mockRestore();
  });

  it('rejects untrusted image domains', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          {
            title: 'good',
            image_url: 'https://example.com/photo.jpg',
            width: 1920,
            height: 1080,
          },
          {
            title: 'google-thumbnail',
            image_url:
              'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcExample',
            width: 1920,
            height: 1080,
          },
        ],
      }),
    } as any);

    const tool = createBraveImageSearch(mockDeps());
    const result = await (tool.execute as any)({ query: 'stellar blade' });

    expect(result.results).toHaveLength(1);
    expect(result.results[0].imageUrl).toBe('https://example.com/photo.jpg');

    fetchSpy.mockRestore();
  });
});
