import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createBrightDataImageSearch } from './image-search.tool.js';
import { createBrightDataVideoSearch } from './video-search.tool.js';

vi.mock('./bright-data-client.js', () => ({
  requestBrightData: vi.fn(),
}));

// Imported after the mock so it resolves to the mocked module.
import { requestBrightData } from './bright-data-client.js';

const mockedRequest = vi.mocked(requestBrightData);

beforeEach(() => {
  mockedRequest.mockReset();
});

function stubDeps() {
  return {
    logger: { log: vi.fn(), warn: vi.fn() },
    defaultLang: 'en',
    getLiveConfig: () => ({
      brightData: {
        enabled: true,
        apiKey: 'test-key',
        serpZone: 'ckir',
        images: { enabled: true, results: 10 },
        videos: { enabled: true, results: 10 },
      },
    }),
  } as any;
}

describe('createBrightDataVideoSearch', () => {
  it('requests Google Videos via udm=7 (not the deprecated tbm=vid)', async () => {
    mockedRequest.mockResolvedValue({ organic: [] });
    const tool = createBrightDataVideoSearch(stubDeps());
    await tool.execute!({ query: 'pizza' }, {} as any);
    const [, , url] = mockedRequest.mock.calls[0];
    expect(String(url)).toContain('udm=7');
    expect(String(url)).not.toContain('tbm=');
  });

  it('parses results from the organic array and maps duration + thumbnail', async () => {
    mockedRequest.mockResolvedValue({
      organic: [
        {
          title: 'Pizza Video',
          link: 'https://www.youtube.com/watch?v=7CM2VU0e1ks',
          description: 'A delicious video',
          duration: '10:42',
        },
      ],
    });
    const tool = createBrightDataVideoSearch(stubDeps());
    const result = (await tool.execute!({ query: 'pizza' }, {} as any)) as any;
    expect(result.results).toEqual([
      {
        title: 'Pizza Video',
        link: 'https://www.youtube.com/watch?v=7CM2VU0e1ks',
        snippet: 'A delicious video',
        channel: '',
        duration: '10:42',
        date: '',
        thumbnailUrl: 'https://i.ytimg.com/vi/7CM2VU0e1ks/maxresdefault.jpg',
        source: 'brightData',
        views: 0,
      },
    ]);
  });

  it('returns an empty result set when there are no organic items', async () => {
    mockedRequest.mockResolvedValue({});
    const tool = createBrightDataVideoSearch(stubDeps());
    const result = (await tool.execute!({ query: 'pizza' }, {} as any)) as any;
    expect(result.results).toEqual([]);
  });
});

describe('createBrightDataImageSearch', () => {
  it('uses original_image for the image URL', async () => {
    mockedRequest.mockResolvedValue({
      images: [
        {
          title: 'A pizza',
          original_image: 'https://upload.wikimedia.org/wikipedia/commons/9/91/Pizza.jpg',
          link: 'https://en.wikipedia.org/wiki/Pizza',
        },
      ],
    });
    const tool = createBrightDataImageSearch(stubDeps());
    const result = (await tool.execute!({ query: 'pizza' }, {} as any)) as any;
    expect(result.results).toEqual([
      {
        title: 'A pizza',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/91/Pizza.jpg',
        sourcePageUrl: 'https://en.wikipedia.org/wiki/Pizza',
        width: undefined,
        height: undefined,
        source: '',
        domain: '',
      },
    ]);
  });

  it('trusts the google-side size filter and keeps results with unknown dimensions', async () => {
    mockedRequest.mockResolvedValue({
      images: [
        {
          title: 'A pizza',
          // No width/height — Bright Data never returns them.
          original_image: 'https://images.unsplash.com/photo-1234',
        },
      ],
    });
    const tool = createBrightDataImageSearch(stubDeps());
    const result = (await tool.execute!({ query: 'pizza' }, {} as any)) as any;
    expect(result.results).toHaveLength(1);
  });

  it('drops base64 data-URI thumbnails even when no original_image is present', async () => {
    mockedRequest.mockResolvedValue({
      images: [
        {
          title: 'A pizza',
          // `image` is the embedded base64 thumbnail — not a usable URL.
          image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgA',
        },
      ],
    });
    const tool = createBrightDataImageSearch(stubDeps());
    const result = (await tool.execute!({ query: 'pizza' }, {} as any)) as any;
    expect(result.results).toEqual([]);
  });

  it('requests images via udm=2 and passes a tbs size filter', async () => {
    mockedRequest.mockResolvedValue({ images: [] });
    const tool = createBrightDataImageSearch(stubDeps());
    await tool.execute!({ query: 'pizza' }, {} as any);
    const [, , url] = mockedRequest.mock.calls[0];
    expect(String(url)).toContain('udm=2');
    expect(String(url)).toContain('tbs=');
  });
});
