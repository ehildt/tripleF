import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  deletePlaylist,
  fetchAllPlaylists,
  fetchPlaylists,
  renamePlaylist,
  savePlaylist,
} from './playlists.api';

function mockFetch(ok = true, body: unknown = {}) {
  const fn = vi.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 500,
    json: async () => body,
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('playlists.api', () => {
  it('url-encodes session, conversation, and playlist-name segments', async () => {
    mockFetch(true, []);
    await savePlaylist('sess/ion', 'conv-id', 'My #1 Playlist/2024?', [
      { videoUrl: 'https://youtu.be/abc' },
    ]);

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toBe(
      '/api/v1/playlists/sess%2Fion/conv-id/My%20%231%20Playlist%2F2024%3F',
    );
  });

  it('encodes the name in fetchAllPlaylists', async () => {
    const fn = mockFetch(true, []);
    await fetchAllPlaylists('session/1');
    expect((fn.mock.calls[0][0] as string).endsWith('session%2F1')).toBe(true);
  });

  it('encodes the conversation id in fetchPlaylists', async () => {
    const fn = mockFetch(true, []);
    await fetchPlaylists('session', 'conv/1');
    expect((fn.mock.calls[0][0] as string).endsWith('/conv%2F1')).toBe(true);
  });

  it('encodes name and newName in renamePlaylist', async () => {
    const fn = mockFetch(true, {});
    await renamePlaylist('s', 'c', 'Old Name', 'New Name');
    expect(fn.mock.calls[0][0] as string).toContain('/Old%20Name/rename');
  });

  it('encodes the name in deletePlaylist', async () => {
    const fn = mockFetch(true, {});
    await deletePlaylist('s', 'c', 'a/b');
    expect((fn.mock.calls[0][0] as string).endsWith('/a%2Fb')).toBe(true);
  });

  it('throws on a failed save', async () => {
    mockFetch(false, {});
    await expect(savePlaylist('s', 'c', 'n', [])).rejects.toThrow(
      'Failed to save playlist',
    );
  });
});
