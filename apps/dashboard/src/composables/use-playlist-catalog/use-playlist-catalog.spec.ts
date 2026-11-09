import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { usePlaylistStore } from '@/stores/widgets/playlist/playlist.store';
import type { PlaylistSnapshot } from '@/types/playlist.model';

import { usePlaylistCatalog } from './use-playlist-catalog';

const {
  fetchAllPlaylistsMock,
  savePlaylistMock,
  renamePlaylistMock,
  deletePlaylistMock,
  toastErrorMock,
} = vi.hoisted(() => ({
  fetchAllPlaylistsMock: vi.fn(),
  savePlaylistMock: vi.fn(),
  renamePlaylistMock: vi.fn(),
  deletePlaylistMock: vi.fn(),
  toastErrorMock: vi.fn(),
}));

vi.mock('@/api/playlists.api', () => ({
  fetchAllPlaylists: fetchAllPlaylistsMock,
  savePlaylist: savePlaylistMock,
  renamePlaylist: renamePlaylistMock,
  deletePlaylist: deletePlaylistMock,
}));

vi.mock('@/composables/use-toast/use-toast', () => ({
  useToast: () => ({ error: toastErrorMock }),
}));

interface DeferredPlaylistRequest {
  promise: Promise<PlaylistSnapshot[]>;
  resolve: (snapshots: PlaylistSnapshot[]) => void;
}

function createDeferredPlaylistRequest(): DeferredPlaylistRequest {
  let resolve!: (snapshots: PlaylistSnapshot[]) => void;
  const promise = new Promise<PlaylistSnapshot[]>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

const VIDEO = { videoUrl: 'https://video.test/one', title: 'One' };

describe('usePlaylistCatalog', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    fetchAllPlaylistsMock.mockReset().mockResolvedValue([]);
    savePlaylistMock.mockReset().mockResolvedValue(undefined);
    renamePlaylistMock.mockReset().mockResolvedValue(undefined);
    deletePlaylistMock.mockReset().mockResolvedValue(undefined);
    toastErrorMock.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads snapshots and restores a valid persisted selection', async () => {
    localStorage.setItem('vision-active-playlist', 'second');
    fetchAllPlaylistsMock.mockResolvedValueOnce([
      { name: 'main', videos: [] },
      { name: 'second', videos: [VIDEO] },
    ]);

    await usePlaylistCatalog().loadPlaylists();

    const store = usePlaylistStore();
    expect(store.playlistNames).toEqual(['main', 'second']);
    expect(store.activePlaylistName).toBe('second');
    expect(store.activePlaylistVideos).toEqual([VIDEO]);
  });

  it('falls back when the persisted selection no longer exists', async () => {
    localStorage.setItem('vision-active-playlist', 'deleted');
    fetchAllPlaylistsMock.mockResolvedValueOnce([{ name: 'main', videos: [] }]);

    await usePlaylistCatalog().loadPlaylists();

    expect(usePlaylistStore().activePlaylistName).toBe('main');
    expect(localStorage.getItem('vision-active-playlist')).toBe('main');
  });

  it('shares one in-flight load across callers', async () => {
    const deferred = createDeferredPlaylistRequest();
    fetchAllPlaylistsMock.mockReturnValueOnce(deferred.promise);
    const catalog = usePlaylistCatalog();

    const first = catalog.loadPlaylists();
    const second = catalog.loadPlaylists();
    expect(fetchAllPlaylistsMock).toHaveBeenCalledTimes(1);

    deferred.resolve([{ name: 'main', videos: [] }]);
    await Promise.all([first, second]);
    expect(usePlaylistStore().playlistNames).toEqual(['main']);
  });

  it('discards an older load after the active selection changes', async () => {
    const store = usePlaylistStore();
    store.replacePlaylists([
      { name: 'first', videos: [] },
      { name: 'second', videos: [] },
    ]);
    const deferred = createDeferredPlaylistRequest();
    fetchAllPlaylistsMock.mockReturnValueOnce(deferred.promise);
    const catalog = usePlaylistCatalog();

    const loading = catalog.loadPlaylists();
    expect(catalog.selectPlaylist('second')).toBe(true);
    deferred.resolve([{ name: 'stale-server', videos: [] }]);
    await loading;

    expect(store.playlistNames).toEqual(['first', 'second']);
    expect(store.activePlaylistName).toBe('second');
  });

  it('discards an older load after a queue edit', async () => {
    const store = usePlaylistStore();
    store.replacePlaylists([{ name: 'main', videos: [] }]);
    const deferred = createDeferredPlaylistRequest();
    fetchAllPlaylistsMock.mockReturnValueOnce(deferred.promise);
    const catalog = usePlaylistCatalog();

    const loading = catalog.loadPlaylists();
    expect(catalog.addVideoToActivePlaylist(VIDEO)).toBe(true);
    deferred.resolve([{ name: 'main', videos: [] }]);
    await loading;

    expect(store.activePlaylistVideos).toEqual([VIDEO]);
    expect(savePlaylistMock).toHaveBeenCalledWith(expect.any(String), 'main', [
      VIDEO,
    ]);
  });

  it('contains load failures and retains current playlist data', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const store = usePlaylistStore();
    store.replacePlaylists([{ name: 'local', videos: [VIDEO] }]);
    fetchAllPlaylistsMock.mockRejectedValueOnce(new Error('offline'));

    await expect(usePlaylistCatalog().loadPlaylists()).resolves.toBeUndefined();

    expect(store.playlistNames).toEqual(['local']);
    expect(store.activePlaylistVideos).toEqual([VIDEO]);
    expect(consoleError).toHaveBeenCalledWith(
      'Playlist loading failed',
      expect.any(Error),
    );
  });

  it('creates and saves a playlist only when local creation succeeds', () => {
    const catalog = usePlaylistCatalog();

    expect(catalog.createPlaylist(' main ')).toEqual({
      name: 'main',
      videos: [],
    });
    expect(catalog.createPlaylist('main')).toBeNull();
    expect(savePlaylistMock).toHaveBeenCalledTimes(1);
    expect(savePlaylistMock).toHaveBeenCalledWith(
      expect.any(String),
      'main',
      [],
    );
  });

  it('keeps a locally created playlist and reports a failed save', async () => {
    savePlaylistMock.mockRejectedValueOnce(new Error('offline'));
    const catalog = usePlaylistCatalog();

    expect(catalog.createPlaylist('local')).not.toBeNull();
    await vi.waitFor(() => expect(toastErrorMock).toHaveBeenCalledTimes(1));

    expect(usePlaylistStore().activePlaylistName).toBe('local');
    expect(usePlaylistStore().playlists).toHaveLength(1);
  });

  it('renames and deletes through the server only after local success', () => {
    const store = usePlaylistStore();
    store.replacePlaylists([
      { name: 'main', videos: [] },
      { name: 'second', videos: [] },
    ]);
    const catalog = usePlaylistCatalog();

    expect(catalog.renamePlaylist('second', 'main')).toBe(false);
    expect(renamePlaylistMock).not.toHaveBeenCalled();
    expect(catalog.renamePlaylist('second', 'renamed')).toBe(true);
    expect(renamePlaylistMock).toHaveBeenCalledWith(
      expect.any(String),
      'second',
      'renamed',
    );

    expect(catalog.deletePlaylist('missing')).toBe(false);
    expect(deletePlaylistMock).not.toHaveBeenCalled();
    expect(catalog.deletePlaylist('renamed')).toBe(true);
    expect(deletePlaylistMock).toHaveBeenCalledWith(
      expect.any(String),
      'renamed',
    );
  });

  it('dedupes queue additions and persists actual removals', () => {
    const store = usePlaylistStore();
    store.replacePlaylists([{ name: 'main', videos: [] }]);
    const catalog = usePlaylistCatalog();

    expect(catalog.addVideoToActivePlaylist(VIDEO)).toBe(true);
    expect(catalog.addVideoToActivePlaylist(VIDEO)).toBe(false);
    expect(savePlaylistMock).toHaveBeenCalledTimes(1);
    expect(catalog.removeVideoFromActivePlaylist('missing')).toBe(false);
    expect(catalog.removeVideoFromActivePlaylist(VIDEO.videoUrl)).toBe(true);
    expect(savePlaylistMock).toHaveBeenCalledTimes(2);
    expect(store.activePlaylistVideos).toEqual([]);
  });
});
