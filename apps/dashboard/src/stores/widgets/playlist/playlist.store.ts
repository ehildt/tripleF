import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import type { VideoGalleryItem } from '@/types/assistant-response-data.model';

import { parseActivePlaylistName } from './helpers/parse-active-playlist-name.helper';
import { ACTIVE_PLAYLIST_STORAGE_KEY } from './playlist.constant';
import type { Playlist } from './playlist.types';

/**
 * Session-global playlist data shared by the docked Chat panel, floating
 * playlist, playback session, and transport controls. Server orchestration
 * belongs to usePlaylistCatalog; this store owns synchronous data changes.
 */
export const usePlaylistStore = defineStore('playlist', () => {
  const playlists = ref<Playlist[]>([]);
  const activePlaylistName = ref('');
  try {
    activePlaylistName.value = parseActivePlaylistName(
      localStorage.getItem(ACTIVE_PLAYLIST_STORAGE_KEY),
    );
  } catch {
    /* Storage unavailable: retain no active selection. */
  }

  const activePlaylist = computed<Playlist | null>(() =>
    getPlaylist(activePlaylistName.value),
  );

  const activePlaylistVideos = computed<VideoGalleryItem[]>(
    () => activePlaylist.value?.videos ?? [],
  );

  const playlistNames = computed<string[]>(() =>
    playlists.value.map((playlist) => playlist.name),
  );

  function getPlaylist(name: string): Playlist | null {
    return playlists.value.find((playlist) => playlist.name === name) ?? null;
  }

  function setActivePlaylist(name: string): void {
    activePlaylistName.value = name;
    try {
      localStorage.setItem(ACTIVE_PLAYLIST_STORAGE_KEY, name);
    } catch {
      /* Storage unavailable: retain the selection in memory. */
    }
  }

  /** Replace the catalog and restore a valid active selection. */
  function replacePlaylists(next: Playlist[]): void {
    playlists.value = next;
    if (!next.some((playlist) => playlist.name === activePlaylistName.value))
      setActivePlaylist(next[0]?.name ?? '');
  }

  /** Select an existing playlist. */
  function selectPlaylist(name: string): boolean {
    if (!getPlaylist(name)) return false;
    setActivePlaylist(name);
    return true;
  }

  /** Create and activate a uniquely named empty playlist. */
  function createPlaylist(name: string): Playlist | null {
    const trimmed = name.trim();
    if (!trimmed) return null;
    if (getPlaylist(trimmed)) return null;
    const playlist: Playlist = { name: trimmed, videos: [] };
    playlists.value = [...playlists.value, playlist];
    setActivePlaylist(trimmed);
    return playlist;
  }

  /** Rename a playlist without changing its queue or ordering. */
  function renamePlaylist(oldName: string, newName: string): boolean {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) return false;
    if (getPlaylist(trimmed)) return false;
    const playlist = getPlaylist(oldName);
    if (!playlist) return false;

    const renamed: Playlist = { ...playlist, name: trimmed };
    playlists.value = playlists.value.map((candidate) =>
      candidate.name === oldName ? renamed : candidate,
    );
    if (activePlaylistName.value === oldName) setActivePlaylist(trimmed);
    return true;
  }

  /** Delete a playlist and fall back when it was active. */
  function deletePlaylist(name: string): boolean {
    if (!getPlaylist(name)) return false;
    const next = playlists.value.filter((playlist) => playlist.name !== name);
    playlists.value = next;
    if (activePlaylistName.value === name)
      setActivePlaylist(next[0]?.name ?? '');

    return true;
  }

  /** Import a queue under a unique name, activate it, and retain first occurrences. */
  function importPlaylist(
    name: string,
    videos: VideoGalleryItem[],
  ): Playlist | null {
    const requestedName = name.trim();
    if (!requestedName) return null;

    let importedName = requestedName;
    let suffix = 2;
    while (getPlaylist(importedName)) {
      importedName = `${requestedName} (${suffix})`;
      suffix += 1;
    }

    const seenVideoUrls = new Set<string>();
    const uniqueVideos = videos.filter((video) => {
      if (seenVideoUrls.has(video.videoUrl)) return false;
      seenVideoUrls.add(video.videoUrl);
      return true;
    });
    const playlist: Playlist = { name: importedName, videos: uniqueVideos };
    playlists.value = [...playlists.value, playlist];
    setActivePlaylist(importedName);
    return playlist;
  }

  /** Append a non-empty, non-duplicate video to the active queue. */
  function addVideoToActivePlaylist(video: VideoGalleryItem): boolean {
    const active = activePlaylist.value;
    if (!active || !video.videoUrl) return false;
    if (active.videos.some((item) => item.videoUrl === video.videoUrl))
      return false;

    active.videos = [...active.videos, video];
    return true;
  }

  /** Remove a matching video from the active queue. */
  function removeVideoFromActivePlaylist(videoUrl: string): boolean {
    const active = activePlaylist.value;
    if (!active) return false;
    if (!active.videos.some((item) => item.videoUrl === videoUrl)) return false;
    active.videos = active.videos.filter((item) => item.videoUrl !== videoUrl);
    return true;
  }

  function isVideoInActivePlaylist(videoUrl: string): boolean {
    return activePlaylistVideos.value.some(
      (video) => video.videoUrl === videoUrl,
    );
  }

  return {
    playlists,
    activePlaylistName,
    activePlaylist,
    activePlaylistVideos,
    playlistNames,
    getPlaylist,
    replacePlaylists,
    selectPlaylist,
    createPlaylist,
    renamePlaylist,
    deletePlaylist,
    importPlaylist,
    addVideoToActivePlaylist,
    removeVideoFromActivePlaylist,
    isVideoInActivePlaylist,
  };
});
