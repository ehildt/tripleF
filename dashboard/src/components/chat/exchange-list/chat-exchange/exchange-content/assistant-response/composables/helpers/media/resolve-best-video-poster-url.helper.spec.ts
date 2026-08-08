import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  clearVideoPosterProbeCache,
  resolveBestVideoPosterUrl,
} from './resolve-best-video-poster-url.helper';

const fetchMock = vi.fn();

function mockFetchStatuses(statuses: Record<string, number>) {
  fetchMock.mockImplementation(async (url: string) => ({
    ok: (statuses[url] ?? 404) < 400,
  }));
}

beforeEach(() => {
  clearVideoPosterProbeCache();
  fetchMock.mockReset();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('resolveBestVideoPosterUrl', () => {
  it('returns the first candidate that exists', async () => {
    mockFetchStatuses({
      'https://i.ytimg.com/vi/abc123/maxresdefault.jpg': 404,
      'https://i.ytimg.com/vi/abc123/hqdefault.jpg': 200,
      'https://i.ytimg.com/vi/abc123/mqdefault.jpg': 200,
    });

    await expect(
      resolveBestVideoPosterUrl([
        'https://i.ytimg.com/vi/abc123/maxresdefault.jpg',
        'https://i.ytimg.com/vi/abc123/hqdefault.jpg',
        'https://i.ytimg.com/vi/abc123/mqdefault.jpg',
      ]),
    ).resolves.toBe('https://i.ytimg.com/vi/abc123/hqdefault.jpg');
  });

  it('returns the highest-resolution candidate when it exists', async () => {
    mockFetchStatuses({
      'https://i.ytimg.com/vi/abc123/maxresdefault.jpg': 200,
    });

    await expect(
      resolveBestVideoPosterUrl([
        'https://i.ytimg.com/vi/abc123/maxresdefault.jpg',
        'https://i.ytimg.com/vi/abc123/hqdefault.jpg',
      ]),
    ).resolves.toBe('https://i.ytimg.com/vi/abc123/maxresdefault.jpg');
  });

  it('returns null when every candidate is missing', async () => {
    mockFetchStatuses({});

    await expect(
      resolveBestVideoPosterUrl([
        'https://i.ytimg.com/vi/abc123/maxresdefault.jpg',
        'https://i.ytimg.com/vi/abc123/hqdefault.jpg',
      ]),
    ).resolves.toBeNull();
  });

  it('treats a fetch failure as unavailable and moves on', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network down'));
    mockFetchStatuses({
      'https://i.ytimg.com/vi/abc123/hqdefault.jpg': 200,
    });

    await expect(
      resolveBestVideoPosterUrl([
        'https://i.ytimg.com/vi/abc123/maxresdefault.jpg',
        'https://i.ytimg.com/vi/abc123/hqdefault.jpg',
      ]),
    ).resolves.toBe('https://i.ytimg.com/vi/abc123/hqdefault.jpg');
  });

  it('caches availability so the same URL is not re-probed', async () => {
    mockFetchStatuses({
      'https://i.ytimg.com/vi/abc123/maxresdefault.jpg': 200,
    });

    await resolveBestVideoPosterUrl([
      'https://i.ytimg.com/vi/abc123/maxresdefault.jpg',
    ]);
    await resolveBestVideoPosterUrl([
      'https://i.ytimg.com/vi/abc123/maxresdefault.jpg',
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
