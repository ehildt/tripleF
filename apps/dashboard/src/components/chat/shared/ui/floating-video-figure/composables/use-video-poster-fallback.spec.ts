import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

import { useVideoPosterFallback } from './use-video-poster-fallback';

const fetchMock = vi.fn();

function mockFetchStatuses(statuses: Record<string, number>) {
  fetchMock.mockImplementation(async (url: string) => ({
    ok: (statuses[url] ?? 404) < 400,
  }));
}

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useVideoPosterFallback', () => {
  it('starts at the highest-resolution candidate', async () => {
    mockFetchStatuses({
      'https://i.ytimg.com/vi/abc123def45/maxresdefault.jpg': 200,
    });
    const posterUrl = ref(
      'https://i.ytimg.com/vi/abc123def45/maxresdefault.jpg',
    );
    const videoUrl = ref('https://www.youtube.com/watch?v=abc123def45');

    const { currentSrc } = useVideoPosterFallback(posterUrl, videoUrl);
    await flushPromises();
    expect(currentSrc.value).toBe(
      'https://i.ytimg.com/vi/abc123def45/maxresdefault.jpg',
    );
  });

  it('advances down the fallback chain on error', async () => {
    mockFetchStatuses({
      'https://i.ytimg.com/vi/abc123def45/maxresdefault.jpg': 200,
      'https://i.ytimg.com/vi/abc123def45/hqdefault.jpg': 200,
      'https://i.ytimg.com/vi/abc123def45/mqdefault.jpg': 200,
    });
    const posterUrl = ref(
      'https://i.ytimg.com/vi/abc123def45/maxresdefault.jpg',
    );
    const videoUrl = ref('https://www.youtube.com/watch?v=abc123def45');

    const { currentSrc, onPosterError } = useVideoPosterFallback(
      posterUrl,
      videoUrl,
    );
    await flushPromises();

    onPosterError();
    expect(currentSrc.value).toBe(
      'https://i.ytimg.com/vi/abc123def45/hqdefault.jpg',
    );

    onPosterError();
    expect(currentSrc.value).toBe(
      'https://i.ytimg.com/vi/abc123def45/mqdefault.jpg',
    );

    // End of the chain: further errors keep the last candidate.
    onPosterError();
    expect(currentSrc.value).toBe(
      'https://i.ytimg.com/vi/abc123def45/mqdefault.jpg',
    );
  });

  it('uses a search-provided thumbnail as-is with no fallback chain', () => {
    const posterUrl = ref('https://cdn.example.com/thumb.jpg');
    const videoUrl = ref('https://www.youtube.com/watch?v=abc123def45');

    const { currentSrc, onPosterError } = useVideoPosterFallback(
      posterUrl,
      videoUrl,
    );

    expect(currentSrc.value).toBe('https://cdn.example.com/thumb.jpg');
    onPosterError();
    expect(currentSrc.value).toBe('https://cdn.example.com/thumb.jpg');
  });

  it('resets to the best candidate when the poster URL changes', async () => {
    mockFetchStatuses({
      'https://i.ytimg.com/vi/abc123def45/maxresdefault.jpg': 200,
      'https://i.ytimg.com/vi/abc123def45/hqdefault.jpg': 200,
      'https://i.ytimg.com/vi/abc123def45/mqdefault.jpg': 200,
      'https://i.ytimg.com/vi/def456ghi01/maxresdefault.jpg': 200,
    });
    const posterUrl = ref(
      'https://i.ytimg.com/vi/abc123def45/maxresdefault.jpg',
    );
    const videoUrl = ref('https://www.youtube.com/watch?v=abc123def45');

    const { currentSrc, onPosterError } = useVideoPosterFallback(
      posterUrl,
      videoUrl,
    );
    await flushPromises();
    onPosterError();
    expect(currentSrc.value).toBe(
      'https://i.ytimg.com/vi/abc123def45/hqdefault.jpg',
    );

    posterUrl.value = 'https://i.ytimg.com/vi/def456ghi01/maxresdefault.jpg';
    videoUrl.value = 'https://www.youtube.com/watch?v=def456ghi01';
    await flushPromises();
    expect(currentSrc.value).toBe(
      'https://i.ytimg.com/vi/def456ghi01/maxresdefault.jpg',
    );
  });

  it('returns null when there is no poster', () => {
    const posterUrl = ref<string | null>(null);
    const videoUrl = ref('https://www.youtube.com/watch?v=abc123def45');

    const { currentSrc } = useVideoPosterFallback(posterUrl, videoUrl);
    expect(currentSrc.value).toBeNull();
  });

  it('jumps to the best available resolution when maxresdefault is missing', async () => {
    mockFetchStatuses({
      'https://i.ytimg.com/vi/missing1234/maxresdefault.jpg': 404,
      'https://i.ytimg.com/vi/missing1234/hqdefault.jpg': 200,
      'https://i.ytimg.com/vi/missing1234/mqdefault.jpg': 200,
    });
    const posterUrl = ref(
      'https://i.ytimg.com/vi/missing1234/maxresdefault.jpg',
    );
    const videoUrl = ref('https://www.youtube.com/watch?v=missing1234');

    const { currentSrc } = useVideoPosterFallback(posterUrl, videoUrl);
    await flushPromises();
    expect(currentSrc.value).toBe(
      'https://i.ytimg.com/vi/missing1234/hqdefault.jpg',
    );
  });

  it('keeps the primary candidate when every probe is unavailable', async () => {
    const primary = 'https://i.ytimg.com/vi/absent12345/maxresdefault.jpg';
    mockFetchStatuses({});
    const posterUrl = ref(primary);
    const videoUrl = ref('https://www.youtube.com/watch?v=absent12345');

    const { currentSrc } = useVideoPosterFallback(posterUrl, videoUrl);
    await flushPromises();

    expect(currentSrc.value).toBe(primary);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('treats probe network failures as unavailable', async () => {
    const primary = 'https://i.ytimg.com/vi/netwrk12345/maxresdefault.jpg';
    fetchMock.mockRejectedValue(new Error('net'));
    const posterUrl = ref(primary);
    const videoUrl = ref('https://www.youtube.com/watch?v=netwrk12345');

    const { currentSrc } = useVideoPosterFallback(posterUrl, videoUrl);
    await flushPromises();

    expect(currentSrc.value).toBe(primary);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('caches a completed probe result per URL across callers', async () => {
    const primary = 'https://i.ytimg.com/vi/cache123456/maxresdefault.jpg';
    mockFetchStatuses({ [primary]: 200 });
    const posterUrl = ref(primary);
    const videoUrl = ref('https://www.youtube.com/watch?v=cache123456');

    useVideoPosterFallback(posterUrl, videoUrl);
    await flushPromises();
    useVideoPosterFallback(posterUrl, videoUrl);
    await flushPromises();

    expect(
      fetchMock.mock.calls.filter(([url]) => url === primary),
    ).toHaveLength(1);
  });

  it('does not probe a search-provided thumbnail', async () => {
    const posterUrl = ref('https://cdn.example.com/thumb.jpg');
    const videoUrl = ref('https://www.youtube.com/watch?v=abc123def45');

    const { currentSrc } = useVideoPosterFallback(posterUrl, videoUrl);
    await flushPromises();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(currentSrc.value).toBe('https://cdn.example.com/thumb.jpg');
  });
});
