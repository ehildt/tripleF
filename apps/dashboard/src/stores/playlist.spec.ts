import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { usePlaylistStore } from './playlist';

const { savePlaylistMock, renamePlaylistMock, deletePlaylistMock } = vi.hoisted(
  () => ({
    savePlaylistMock: vi.fn().mockResolvedValue(undefined),
    renamePlaylistMock: vi.fn().mockResolvedValue(undefined),
    deletePlaylistMock: vi.fn().mockResolvedValue(undefined),
  }),
);

vi.mock('@/api/playlists.api', () => ({
  fetchAllPlaylists: vi.fn().mockResolvedValue([]),
  savePlaylist: savePlaylistMock,
  renamePlaylist: renamePlaylistMock,
  deletePlaylist: deletePlaylistMock,
}));

describe('usePlaylistStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    savePlaylistMock.mockClear();
    renamePlaylistMock.mockClear();
    deletePlaylistMock.mockClear();
  });

  it('starts with panel defaults and a closed floating window', () => {
    const store = usePlaylistStore();

    expect(store.playlistMode).toBe('panel');
    expect(store.playlistAnchor).toBe('top-right');
    expect(store.playlistAutoClose).toBe(false);
    expect(store.floatingPlaylistOpen).toBe(false);
    expect(store.playlistPreviewVisible).toBe(false);
  });

  it('hydrates persisted settings from localStorage', () => {
    localStorage.setItem('vision-playlist-mode', 'floating');
    localStorage.setItem('vision-playlist-anchor', 'bottom-left');
    localStorage.setItem('vision-playlist-auto-close', 'true');

    const store = usePlaylistStore();

    expect(store.playlistMode).toBe('floating');
    expect(store.playlistAnchor).toBe('bottom-left');
    expect(store.playlistAutoClose).toBe(true);
  });

  it('setPlaylistMode persists and opens the floating window on enable', () => {
    const store = usePlaylistStore();

    store.setPlaylistMode('floating');

    expect(store.playlistMode).toBe('floating');
    expect(store.floatingPlaylistOpen).toBe(true);
    expect(localStorage.getItem('vision-playlist-mode')).toBe('floating');
  });

  it('setPlaylistAnchor and setPlaylistAutoClose persist', () => {
    const store = usePlaylistStore();

    store.setPlaylistAnchor('bottom-right');
    store.setPlaylistAutoClose(true);

    expect(store.playlistAnchor).toBe('bottom-right');
    expect(localStorage.getItem('vision-playlist-anchor')).toBe('bottom-right');
    expect(store.playlistAutoClose).toBe(true);
    expect(localStorage.getItem('vision-playlist-auto-close')).toBe('true');
  });

  it('resetPlaylistSettings restores defaults', () => {
    const store = usePlaylistStore();
    store.setPlaylistMode('floating');
    store.setPlaylistAnchor('bottom-left');
    store.setPlaylistAutoClose(true);

    store.resetPlaylistSettings();

    expect(store.playlistMode).toBe('panel');
    expect(store.playlistAnchor).toBe('top-right');
    expect(store.playlistAutoClose).toBe(false);
  });

  it('toggles and hides the preview', () => {
    const store = usePlaylistStore();

    store.togglePlaylistPreview();
    expect(store.playlistPreviewVisible).toBe(true);

    store.hidePlaylistPreview();
    expect(store.playlistPreviewVisible).toBe(false);
  });

  it('creates a playlist, deduping by name, and activates it', () => {
    const store = usePlaylistStore();

    store.createPlaylist('main');
    store.createPlaylist('main');

    expect(store.playlists).toHaveLength(1);
    expect(store.activePlaylistName).toBe('main');
    expect(savePlaylistMock).toHaveBeenCalledTimes(1);
  });

  it('renamePlaylist rejects a taken name and renames otherwise', () => {
    const store = usePlaylistStore();
    store.createPlaylist('main');
    store.createPlaylist('second');

    expect(store.renamePlaylist('second', 'main')).toBe(false);
    expect(store.renamePlaylist('second', 'renamed')).toBe(true);
    expect(store.activePlaylistName).toBe('renamed');
  });

  it('deletePlaylist falls back the active selection', () => {
    const store = usePlaylistStore();
    store.createPlaylist('main');
    store.createPlaylist('second');

    store.deletePlaylist('second');

    expect(store.playlists.map((p) => p.name)).toEqual(['main']);
    expect(store.activePlaylistName).toBe('main');
  });

  it('selectPlaylist switches the active playlist', () => {
    const store = usePlaylistStore();
    store.createPlaylist('main');
    store.createPlaylist('second');

    store.selectPlaylist('main');

    expect(store.activePlaylistName).toBe('main');
  });

  it('adds and removes videos from the active playlist, deduping adds', () => {
    const store = usePlaylistStore();
    store.createPlaylist('main');
    const video = { videoUrl: 'https://video.test/one' };

    store.addVideoToActivePlaylist(video);
    store.addVideoToActivePlaylist(video);

    expect(store.getActivePlaylistVideos()).toHaveLength(1);

    store.removeVideoFromActivePlaylist(video.videoUrl);

    expect(store.getActivePlaylistVideos()).toHaveLength(0);
  });
});
