import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_PLAYLIST_ANCHOR,
  DEFAULT_PLAYLIST_MODE,
  floatingPlaylistOpen,
  playlistAnchor,
  playlistAutoClose,
  playlistMode,
  resetPlaylistSettings,
  setPlaylistAnchor,
  setPlaylistAutoClose,
  setPlaylistMode,
} from './playlist-settings.state';

describe('playlist-settings.state', () => {
  beforeEach(() => {
    localStorage.clear();
    resetPlaylistSettings();
  });

  it('loads defaults when nothing is stored', async () => {
    vi.resetModules();
    const mod = await import('./playlist-settings.state');
    expect(mod.playlistMode.value).toBe('panel');
    expect(mod.playlistAnchor.value).toBe('middle-right');
    expect(mod.playlistAutoClose.value).toBe(false);
    expect(mod.floatingPlaylistOpen.value).toBe(false);
  });

  it('hydrates the settings from localStorage', async () => {
    localStorage.setItem('vision-playlist-mode', 'floating');
    localStorage.setItem('vision-playlist-anchor', 'top-left');
    localStorage.setItem('vision-playlist-auto-close', 'true');
    vi.resetModules();
    const mod = await import('./playlist-settings.state');
    expect(mod.playlistMode.value).toBe('floating');
    expect(mod.playlistAnchor.value).toBe('top-left');
    expect(mod.playlistAutoClose.value).toBe(true);
  });

  it('falls back to the panel mode for unknown stored values', async () => {
    localStorage.setItem('vision-playlist-mode', 'sidebar');
    vi.resetModules();
    const mod = await import('./playlist-settings.state');
    expect(mod.playlistMode.value).toBe('panel');
  });

  it('persists the mode', () => {
    setPlaylistMode('floating');
    expect(playlistMode.value).toBe('floating');
    expect(localStorage.getItem('vision-playlist-mode')).toBe('floating');
  });

  it('enabling floating mode opens the player window', () => {
    setPlaylistMode('floating');
    expect(floatingPlaylistOpen.value).toBe(true);
  });

  it('does not auto-open from a stored saved playlist (playlists load from the database)', async () => {
    localStorage.setItem(
      'vision-saved-playlists',
      JSON.stringify([{ id: 'p1', name: 'Focus', videos: [] }]),
    );
    vi.resetModules();
    const mod = await import('./playlist-settings.state');
    expect(mod.floatingPlaylistOpen.value).toBe(false);
  });

  it('does not auto-open from a stored queue (playlists load from the database)', async () => {
    localStorage.setItem(
      'vision-playlist-videos',
      JSON.stringify({
        'floating-playlist': [
          { videoUrl: 'https://youtu.be/abc', title: 'Some video' },
        ],
      }),
    );
    vi.resetModules();
    const mod = await import('./playlist-settings.state');
    expect(mod.floatingPlaylistOpen.value).toBe(false);
  });

  it('persists the anchor', () => {
    setPlaylistAnchor('bottom-left');
    expect(playlistAnchor.value).toBe('bottom-left');
    expect(localStorage.getItem('vision-playlist-anchor')).toBe('bottom-left');
  });

  it('persists autoclose', () => {
    setPlaylistAutoClose(true);
    expect(playlistAutoClose.value).toBe(true);
    expect(localStorage.getItem('vision-playlist-auto-close')).toBe('true');
  });

  it('reset restores the defaults', () => {
    setPlaylistMode('floating');
    setPlaylistAnchor('top-right');
    setPlaylistAutoClose(true);
    resetPlaylistSettings();
    expect(playlistMode.value).toBe(DEFAULT_PLAYLIST_MODE);
    expect(playlistAnchor.value).toBe(DEFAULT_PLAYLIST_ANCHOR);
    expect(playlistAutoClose.value).toBe(false);
    expect(localStorage.getItem('vision-playlist-mode')).toBe('panel');
  });
});
