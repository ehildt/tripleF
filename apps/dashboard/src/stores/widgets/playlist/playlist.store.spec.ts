import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { usePlaylistStore } from './playlist.store';

const VIDEO = { videoUrl: 'https://video.test/one', title: 'One' };

describe('usePlaylistStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('starts with an empty catalog and hydrated active selection', () => {
    localStorage.setItem('vision-active-playlist', 'saved');
    const store = usePlaylistStore();

    expect(store.playlists).toEqual([]);
    expect(store.activePlaylistName).toBe('saved');
    expect(store.activePlaylist).toBeNull();
    expect(store.activePlaylistVideos).toEqual([]);
    expect(store.playlistNames).toEqual([]);
  });

  it('derives the active playlist, names, videos, and membership', () => {
    const store = usePlaylistStore();
    store.replacePlaylists([
      { name: 'main', videos: [VIDEO] },
      { name: 'second', videos: [] },
    ]);

    expect(store.activePlaylist?.name).toBe('main');
    expect(store.getPlaylist('main')).toEqual(store.activePlaylist);
    expect(store.getPlaylist('missing')).toBeNull();
    expect(store.activePlaylistVideos).toEqual([VIDEO]);
    expect(store.playlistNames).toEqual(['main', 'second']);
    expect(store.isVideoInActivePlaylist(VIDEO.videoUrl)).toBe(true);
    expect(store.isVideoInActivePlaylist('missing')).toBe(false);
  });

  it('preserves a persisted selection that still exists', () => {
    localStorage.setItem('vision-active-playlist', 'second');
    const store = usePlaylistStore();

    store.replacePlaylists([
      { name: 'main', videos: [] },
      { name: 'second', videos: [] },
    ]);

    expect(store.activePlaylistName).toBe('second');
    expect(localStorage.getItem('vision-active-playlist')).toBe('second');
  });

  it('falls back to the first replacement or no selection', () => {
    localStorage.setItem('vision-active-playlist', 'deleted');
    const store = usePlaylistStore();

    store.replacePlaylists([{ name: 'main', videos: [] }]);
    expect(store.activePlaylistName).toBe('main');
    expect(localStorage.getItem('vision-active-playlist')).toBe('main');

    store.replacePlaylists([]);
    expect(store.activePlaylistName).toBe('');
    expect(localStorage.getItem('vision-active-playlist')).toBe('');
  });

  it('creates, dedupes, and activates playlists', () => {
    const store = usePlaylistStore();

    expect(store.createPlaylist(' main ')).toEqual({
      name: 'main',
      videos: [],
    });
    expect(store.createPlaylist('main')).toBeNull();
    expect(store.createPlaylist(' ')).toBeNull();
    expect(store.playlists).toHaveLength(1);
    expect(store.activePlaylistName).toBe('main');
  });

  it('renames only to a unique non-empty name and updates active selection', () => {
    const store = usePlaylistStore();
    store.createPlaylist('main');
    store.createPlaylist('second');

    expect(store.renamePlaylist('second', 'main')).toBe(false);
    expect(store.renamePlaylist('second', ' ')).toBe(false);
    expect(store.renamePlaylist('second', 'renamed')).toBe(true);
    expect(store.activePlaylistName).toBe('renamed');
    expect(store.playlistNames).toEqual(['main', 'renamed']);
  });

  it('deletes existing playlists and falls back from the active one', () => {
    const store = usePlaylistStore();
    store.createPlaylist('main');
    store.createPlaylist('second');

    expect(store.deletePlaylist('missing')).toBe(false);
    expect(store.deletePlaylist('second')).toBe(true);
    expect(store.playlistNames).toEqual(['main']);
    expect(store.activePlaylistName).toBe('main');
  });

  it('selects existing playlists only', () => {
    const store = usePlaylistStore();
    store.createPlaylist('main');
    store.createPlaylist('second');

    expect(store.selectPlaylist('missing')).toBe(false);
    expect(store.activePlaylistName).toBe('second');
    expect(store.selectPlaylist('main')).toBe(true);
    expect(store.activePlaylistName).toBe('main');
  });

  it('imports complete queues with unique names and first-occurrence dedupe', () => {
    const store = usePlaylistStore();
    store.createPlaylist('main');
    store.createPlaylist('main (2)');
    const first = { videoUrl: 'https://cdn.example.com/one.mp4', title: 'One' };
    const second = {
      videoUrl: 'https://cdn.example.com/two.mp4',
      title: 'Two',
    };

    const imported = store.importPlaylist(' main ', [
      first,
      second,
      { ...first, title: 'Duplicate' },
    ]);

    expect(imported).toEqual({ name: 'main (3)', videos: [first, second] });
    expect(store.activePlaylistName).toBe('main (3)');
    expect(store.activePlaylistVideos).toEqual([first, second]);
    expect(store.importPlaylist(' ', [])).toBeNull();
    expect(store.importPlaylist('empty', [])).toEqual({
      name: 'empty',
      videos: [],
    });
    expect(store.activePlaylistName).toBe('empty');
  });

  it('adds and removes active-queue videos with explicit outcomes', () => {
    const store = usePlaylistStore();
    store.createPlaylist('main');

    expect(store.addVideoToActivePlaylist(VIDEO)).toBe(true);
    expect(store.addVideoToActivePlaylist(VIDEO)).toBe(false);
    expect(store.activePlaylistVideos).toEqual([VIDEO]);
    expect(store.removeVideoFromActivePlaylist('missing')).toBe(false);
    expect(store.removeVideoFromActivePlaylist(VIDEO.videoUrl)).toBe(true);
    expect(store.removeVideoFromActivePlaylist(VIDEO.videoUrl)).toBe(false);
    expect(store.activePlaylistVideos).toEqual([]);
  });
});
