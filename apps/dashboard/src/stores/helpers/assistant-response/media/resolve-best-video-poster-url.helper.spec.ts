import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  clearVideoPosterProbeCache,
  resolveBestVideoPosterUrl,
} from './resolve-best-video-poster-url.helper';

describe('resolveBestVideoPosterUrl', () => {
  beforeEach(() => {
    clearVideoPosterProbeCache();
    vi.restoreAllMocks();
  });

  it('returns the first available candidate', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
    await expect(
      resolveBestVideoPosterUrl(['https://a.jpg', 'https://b.jpg']),
    ).resolves.toBe('https://a.jpg');
  });

  it('skips a missing high-res candidate for the next one', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      resolveBestVideoPosterUrl(['https://max.jpg', 'https://hq.jpg']),
    ).resolves.toBe('https://hq.jpg');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('returns null when every candidate is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    await expect(
      resolveBestVideoPosterUrl(['https://a.jpg']),
    ).resolves.toBeNull();
  });

  it('treats a network failure as unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('net')));
    await expect(
      resolveBestVideoPosterUrl(['https://a.jpg']),
    ).resolves.toBeNull();
  });

  it('caches the probe result per URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    await resolveBestVideoPosterUrl(['https://a.jpg']);
    await resolveBestVideoPosterUrl(['https://a.jpg']);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
