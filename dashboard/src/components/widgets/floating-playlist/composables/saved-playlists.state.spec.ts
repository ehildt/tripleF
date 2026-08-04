import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  activeSavedPlaylistId,
  deleteSavedPlaylist,
  MAX_SAVED_PLAYLISTS,
  renameSavedPlaylist,
  savedPlaylists,
  savePlaylist,
  syncActiveSavedPlaylist,
} from './saved-playlists.state';

const item = {
  videoUrl: 'https://www.youtube.com/watch?v=abc',
  title: 'Some video',
};

const otherItem = {
  videoUrl: 'https://youtu.be/other',
  title: 'Other video',
};

describe('saved-playlists.state', () => {
  beforeEach(() => {
    localStorage.clear();
    savedPlaylists.value = [];
    activeSavedPlaylistId.value = null;
  });

  it('hydrates from localStorage at module load', async () => {
    localStorage.setItem(
      'vision-saved-playlists',
      JSON.stringify([{ id: 'p1', name: 'Focus', videos: [item] }]),
    );
    vi.resetModules();
    const mod = await import('./saved-playlists.state');
    expect(mod.savedPlaylists.value).toHaveLength(1);
    expect(mod.savedPlaylists.value[0].name).toBe('Focus');
  });

  it('drops malformed stored entries on hydration', async () => {
    localStorage.setItem(
      'vision-saved-playlists',
      JSON.stringify([
        { id: 'p1', name: 'Focus', videos: [item] },
        { id: '', name: 'Broken', videos: [] },
        { name: 'Missing id', videos: [] },
      ]),
    );
    vi.resetModules();
    const mod = await import('./saved-playlists.state');
    expect(mod.savedPlaylists.value).toHaveLength(1);
  });

  it('saves a queue under a name and persists it', () => {
    const saved = savePlaylist('Focus', [item, otherItem]);
    expect(saved?.name).toBe('Focus');
    expect(saved?.videos).toHaveLength(2);
    expect(savedPlaylists.value).toHaveLength(1);
    const stored = JSON.parse(localStorage.getItem('vision-saved-playlists')!);
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe('Focus');
  });

  it('trims and caps the name', () => {
    const saved = savePlaylist('   spaced   ', [item]);
    expect(saved?.name).toBe('spaced');
    const long = savePlaylist('x'.repeat(100), [item]);
    expect(long?.name).toHaveLength(40);
  });

  it('overwrites an existing playlist of the same name in place', () => {
    const first = savePlaylist('Focus', [item]);
    const second = savePlaylist('Focus', [otherItem, item]);
    expect(savedPlaylists.value).toHaveLength(1);
    expect(second?.id).toBe(first?.id);
    expect(second?.videos).toHaveLength(2);
    expect(second?.videos[0].videoUrl).toBe(otherItem.videoUrl);
  });

  it('refuses empty names but allows empty queues', () => {
    expect(savePlaylist('   ', [item])).toBeNull();
    const saved = savePlaylist('Focus', []);
    expect(saved).not.toBeNull();
    expect(saved?.videos).toEqual([]);
    expect(savedPlaylists.value).toHaveLength(1);
  });

  it('refuses new playlists past the limit', () => {
    for (let i = 0; i < MAX_SAVED_PLAYLISTS; i += 1) {
      expect(savePlaylist(`P${i}`, [item])).not.toBeNull();
    }
    expect(savePlaylist('Overflow', [item])).toBeNull();
    // Overwriting an existing name still works at the limit.
    expect(savePlaylist('P0', [otherItem])).not.toBeNull();
  });

  it('does not share video arrays with the caller', () => {
    const queue = [item];
    savePlaylist('Focus', queue);
    queue.push(otherItem);
    expect(savedPlaylists.value[0].videos).toHaveLength(1);
  });

  it('deletes by id and persists the removal', () => {
    const saved = savePlaylist('Focus', [item]);
    deleteSavedPlaylist(saved!.id);
    expect(savedPlaylists.value).toHaveLength(0);
    expect(localStorage.getItem('vision-saved-playlists')).toBe('[]');
  });

  it('delete is a no-op for unknown ids', () => {
    savePlaylist('Focus', [item]);
    deleteSavedPlaylist('unknown-id');
    expect(savedPlaylists.value).toHaveLength(1);
  });

  it('saving marks the playlist as active', () => {
    const saved = savePlaylist('Focus', [item]);
    expect(activeSavedPlaylistId.value).toBe(saved?.id);
  });

  it('renaming applies and persists', () => {
    const saved = savePlaylist('Focus', [item]);
    const renamed = renameSavedPlaylist(saved!.id, 'Chill');
    expect(renamed?.name).toBe('Chill');
    expect(savedPlaylists.value[0].name).toBe('Chill');
    expect(
      JSON.parse(localStorage.getItem('vision-saved-playlists')!)[0].name,
    ).toBe('Chill');
  });

  it('rename rejects unknown ids, empty, unchanged, and taken names', () => {
    const saved = savePlaylist('Focus', [item]);
    savePlaylist('Chill', [otherItem]);
    expect(renameSavedPlaylist('unknown', 'Other')).toBeNull();
    expect(renameSavedPlaylist(saved!.id, '   ')).toBeNull();
    expect(renameSavedPlaylist(saved!.id, 'Focus')).toBeNull();
    expect(renameSavedPlaylist(saved!.id, 'Chill')).toBeNull();
    expect(savedPlaylists.value[0].name).toBe('Focus');
  });

  it('sync mirrors the queue into the active saved playlist', () => {
    savePlaylist('Focus', [item]);
    syncActiveSavedPlaylist([otherItem]);
    expect(savedPlaylists.value[0].videos).toEqual([otherItem]);
    expect(
      JSON.parse(localStorage.getItem('vision-saved-playlists')!)[0].videos,
    ).toHaveLength(1);
  });

  it('sync without an active playlist is a no-op', () => {
    savePlaylist('Focus', [item]);
    activeSavedPlaylistId.value = null;
    syncActiveSavedPlaylist([otherItem]);
    expect(savedPlaylists.value[0].videos).toEqual([item]);
  });

  it('sync with a dangling active id clears it', () => {
    savePlaylist('Focus', [item]);
    activeSavedPlaylistId.value = 'dangling-id';
    syncActiveSavedPlaylist([otherItem]);
    expect(activeSavedPlaylistId.value).toBeNull();
    expect(savedPlaylists.value[0].videos).toEqual([item]);
  });

  it('deleting the active playlist clears its mark', () => {
    const saved = savePlaylist('Focus', [item]);
    deleteSavedPlaylist(saved!.id);
    expect(activeSavedPlaylistId.value).toBeNull();
  });
});
