import { describe, expect, it, vi } from 'vitest';

import { createSerperBusinessReviewsSearch } from './serper/business-reviews-search.tool.js';
import { createSerperImageSearch } from './serper/image-search.tool.js';
import { createSerperNewsSearch } from './serper/news-search.tool.js';
import { createSerperPlacesSearch } from './serper/places-search.tool.js';
import { createSerperShoppingSearch } from './serper/shopping-search.tool.js';
import { createSerperVideoSearch } from './serper/video-search.tool.js';
import { createSerperWebSearch } from './serper/web-search.tool.js';
import {
  STANDALONE_QUERY_DESCRIPTION,
  STANDALONE_QUERY_TOOL_CLAUSE,
} from './standalone-query.constants.js';

describe('createSerperImageSearch', () => {
  const mockDeps = () =>
    ({
      logger: { log: vi.fn(), warn: vi.fn() },
      getLiveConfig: () => ({
        serper: {
          enabled: true,
          apiKey: 'test-key',
          images: { enabled: true, results: 10 },
        },
      }),
    }) as any;

  it('passes tbs size filter when minWidth/minHeight are provided', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ images: [] }),
    } as any);

    const tool = createSerperImageSearch(mockDeps());
    await (tool.execute as any)({
      query: 'stellar blade',
      minWidth: 1920,
      minHeight: 1080,
    });

    const body = JSON.parse(fetchSpy.mock.calls[0][1].body as string);
    // 1920*1080 = ~2.07 mp. The largest Google bucket threshold <= 2.07 mp is 2mp.
    expect(body.tbs).toBe('isz:lt,islt:2mp');

    fetchSpy.mockRestore();
  });

  it('defaults to the xga tbs filter for the 720p floor when no dimensions are provided', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ images: [] }),
    } as any);

    const tool = createSerperImageSearch(mockDeps());
    await (tool.execute as any)({ query: 'stellar blade' });

    const body = JSON.parse(fetchSpy.mock.calls[0][1].body as string);
    // 1280*720 = 0.92 mp. The largest Google bucket threshold <= 0.92 mp is xga (>1024×768).
    expect(body.tbs).toBe('isz:lt,islt:xga');

    fetchSpy.mockRestore();
  });

  it('maps 4K dimensions to the 8mp Google bucket', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ images: [] }),
    } as any);

    const tool = createSerperImageSearch(mockDeps());
    await (tool.execute as any)({
      query: 'stellar blade',
      minWidth: 3840,
      minHeight: 2160,
    });

    const body = JSON.parse(fetchSpy.mock.calls[0][1].body as string);
    expect(body.tbs).toBe('isz:lt,islt:8mp');

    fetchSpy.mockRestore();
  });

  it('filters results below requested dimensions', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        images: [
          {
            title: 'big',
            imageUrl: 'https://example.com/big.jpg',
            imageWidth: 1920,
            imageHeight: 1080,
          },
          {
            title: 'small',
            imageUrl: 'https://example.com/small.jpg',
            imageWidth: 640,
            imageHeight: 480,
          },
        ],
      }),
    } as any);

    const tool = createSerperImageSearch(mockDeps());
    const result = await (tool.execute as any)({
      query: 'stellar blade',
      minWidth: 1920,
      minHeight: 1080,
    });

    expect(result.results).toHaveLength(1);
    expect(result.results[0].imageUrl).toBe('https://example.com/big.jpg');

    fetchSpy.mockRestore();
  });

  it('filters results below the default 720p minimum', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        images: [
          {
            title: 'hd',
            imageUrl: 'https://example.com/hd.jpg',
            imageWidth: 1920,
            imageHeight: 1080,
          },
          {
            title: 'below-720p',
            imageUrl: 'https://example.com/small.jpg',
            imageWidth: 1024,
            imageHeight: 768,
          },
          {
            title: 'tiny',
            imageUrl: 'https://example.com/tiny.jpg',
            imageWidth: 640,
            imageHeight: 480,
          },
        ],
      }),
    } as any);

    const tool = createSerperImageSearch(mockDeps());
    const result = await (tool.execute as any)({ query: 'stellar blade' });

    expect(result.results).toHaveLength(1);
    expect(result.results[0].imageUrl).toBe('https://example.com/hd.jpg');

    fetchSpy.mockRestore();
  });

  it('filters results below an explicit high-resolution request', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        images: [
          {
            title: '1080p',
            imageUrl: 'https://example.com/1080p.jpg',
            imageWidth: 1920,
            imageHeight: 1080,
          },
          {
            title: '1440p',
            imageUrl: 'https://example.com/1440p.jpg',
            imageWidth: 2560,
            imageHeight: 1440,
          },
        ],
      }),
    } as any);

    const tool = createSerperImageSearch(mockDeps());
    const result = await (tool.execute as any)({
      query: 'stellar blade',
      minWidth: 2560,
      minHeight: 1440,
    });

    expect(result.results).toHaveLength(1);
    expect(result.results[0].imageUrl).toBe('https://example.com/1440p.jpg');

    fetchSpy.mockRestore();
  });

  it('rejects untrusted image domains', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        images: [
          {
            title: 'good',
            imageUrl: 'https://example.com/photo.jpg',
            imageWidth: 1920,
            imageHeight: 1080,
          },
          {
            title: 'google-thumbnail',
            imageUrl:
              'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcExample',
            imageWidth: 1920,
            imageHeight: 1080,
          },
        ],
      }),
    } as any);

    const tool = createSerperImageSearch(mockDeps());
    const result = await (tool.execute as any)({ query: 'stellar blade' });

    expect(result.results).toHaveLength(1);
    expect(result.results[0].imageUrl).toBe('https://example.com/photo.jpg');

    fetchSpy.mockRestore();
  });
});

describe('createSerperVideoSearch', () => {
  const mockDeps = (results = 6) =>
    ({
      logger: { log: vi.fn(), warn: vi.fn() },
      getLiveConfig: () => ({
        serper: {
          enabled: true,
          apiKey: 'test-key',
          videos: { enabled: true, results },
        },
      }),
    }) as any;

  it('slices Serper video API results to the configured count', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        videos: Array.from({ length: 10 }, (_, i) => ({
          title: `Video ${i}`,
          link: `https://www.youtube.com/watch?v=v${i}`,
          snippet: 'snippet',
          channel: 'channel',
          duration: '1:00',
          date: '1 day ago',
          imageUrl: 'https://example.com/thumb.jpg',
          views: 1000,
        })),
      }),
    } as any);

    const tool = createSerperVideoSearch(mockDeps(6));
    const result = await (tool.execute as any)({ query: 'stellar blade' });

    expect(result.results).toHaveLength(6);
    expect(result.results[0].link).toBe('https://www.youtube.com/watch?v=v0');
    expect(result.results[5].link).toBe('https://www.youtube.com/watch?v=v5');

    fetchSpy.mockRestore();
  });

  it('honours an explicit count smaller than the configured default', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        videos: Array.from({ length: 10 }, (_, i) => ({
          title: `Video ${i}`,
          link: `https://www.youtube.com/watch?v=v${i}`,
          snippet: 'snippet',
          channel: 'channel',
          duration: '1:00',
          date: '1 day ago',
          imageUrl: 'https://example.com/thumb.jpg',
          views: 1000,
        })),
      }),
    } as any);

    const tool = createSerperVideoSearch(mockDeps(6));
    const result = await (tool.execute as any)({
      query: 'stellar blade',
      count: 3,
    });

    expect(result.results).toHaveLength(3);

    fetchSpy.mockRestore();
  });

  it('does not exceed the configured maximum when API returns fewer results', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        videos: Array.from({ length: 2 }, (_, i) => ({
          title: `Video ${i}`,
          link: `https://www.youtube.com/watch?v=v${i}`,
          snippet: 'snippet',
          channel: 'channel',
          duration: '1:00',
          date: '1 day ago',
          imageUrl: 'https://example.com/thumb.jpg',
          views: 1000,
        })),
      }),
    } as any);

    const tool = createSerperVideoSearch(mockDeps(6));
    const result = await (tool.execute as any)({ query: 'stellar blade' });

    expect(result.results).toHaveLength(2);

    fetchSpy.mockRestore();
  });
});

describe('standalone query guidance', () => {
  const stubDeps = () =>
    ({
      logger: { log: vi.fn(), warn: vi.fn() },
      getLiveConfig: () => ({
        serper: {
          enabled: true,
          apiKey: 'test-key',
          web: { enabled: true, results: 10 },
        },
      }),
    }) as any;

  const genericSearchTools = [
    ['web search', createSerperWebSearch],
    ['image search', createSerperImageSearch],
    ['news search', createSerperNewsSearch],
    ['video search', createSerperVideoSearch],
  ] as const;

  it.each(genericSearchTools)(
    '%s repeats the standalone-query clause in its tool description',
    (_name, factory) => {
      const tool = factory(stubDeps());
      expect(tool.description).toContain(STANDALONE_QUERY_TOOL_CLAUSE);
    },
  );

  it.each(genericSearchTools)(
    '%s describes its query argument with the shared standalone-query contract',
    (_name, factory) => {
      const tool = factory(stubDeps());
      const queryDescription = (tool.inputSchema as any).shape.query
        .description as string;
      expect(queryDescription).toContain(STANDALONE_QUERY_DESCRIPTION);
    },
  );

  it('places search asks for an explicitly named business and location', () => {
    const tool = createSerperPlacesSearch(stubDeps());
    const queryDescription = (tool.inputSchema as any).shape.query
      .description as string;
    expect(queryDescription).toContain('standalone places search query');
    expect(queryDescription).toContain('never copy the user message verbatim');
  });

  it('shopping search demands a standalone resolved product reference', () => {
    const tool = createSerperShoppingSearch(stubDeps());
    const queryDescription = (tool.inputSchema as any).shape.query
      .description as string;
    expect(queryDescription).toContain('kept short and standalone');
    expect(queryDescription).toContain('resolve product references');
  });

  it('reviews search demands an explicitly named business resolved from the conversation', () => {
    const tool = createSerperBusinessReviewsSearch(stubDeps());
    const queryDescription = (tool.inputSchema as any).shape.query
      .description as string;
    expect(queryDescription).toContain('named explicitly');
    expect(queryDescription).toContain('resolved from the conversation');
  });
});
