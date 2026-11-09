import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { usePlaylistSettingsStore } from './playlist-settings.store';

describe('usePlaylistSettingsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('starts with panel defaults', () => {
    const store = usePlaylistSettingsStore();

    expect(store.playlistMode).toBe('panel');
    expect(store.playlistAnchor).toBe('top-right');
    expect(store.playlistAutoClose).toBe(false);
  });

  it('hydrates persisted settings from localStorage', () => {
    localStorage.setItem('vision-playlist-mode', 'floating');
    localStorage.setItem('vision-playlist-anchor', 'bottom-left');
    localStorage.setItem('vision-playlist-auto-close', 'true');

    const store = usePlaylistSettingsStore();

    expect(store.playlistMode).toBe('floating');
    expect(store.playlistAnchor).toBe('bottom-left');
    expect(store.playlistAutoClose).toBe(true);
  });

  it('ignores invalid persisted mode and anchor values', () => {
    localStorage.setItem('vision-playlist-mode', 'invalid');
    localStorage.setItem('vision-playlist-anchor', 'elsewhere');

    const store = usePlaylistSettingsStore();

    expect(store.playlistMode).toBe('panel');
    expect(store.playlistAnchor).toBe('top-right');
  });

  it('persists mode, anchor, and autoclose changes', () => {
    const store = usePlaylistSettingsStore();

    store.setPlaylistMode('floating');
    store.setPlaylistAnchor('bottom-right');
    store.setPlaylistAutoClose(true);

    expect(store.playlistMode).toBe('floating');
    expect(localStorage.getItem('vision-playlist-mode')).toBe('floating');
    expect(store.playlistAnchor).toBe('bottom-right');
    expect(localStorage.getItem('vision-playlist-anchor')).toBe('bottom-right');
    expect(store.playlistAutoClose).toBe(true);
    expect(localStorage.getItem('vision-playlist-auto-close')).toBe('true');
  });

  it('resets every preference to its default', () => {
    const store = usePlaylistSettingsStore();
    store.setPlaylistMode('floating');
    store.setPlaylistAnchor('bottom-left');
    store.setPlaylistAutoClose(true);

    store.resetPlaylistSettings();

    expect(store.playlistMode).toBe('panel');
    expect(store.playlistAnchor).toBe('top-right');
    expect(store.playlistAutoClose).toBe(false);
  });
});
