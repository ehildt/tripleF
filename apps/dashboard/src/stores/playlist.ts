import { defineStore } from 'pinia';
import { ref } from 'vue';

import {
  deletePlaylist as deletePlaylistApi,
  fetchAllPlaylists,
  renamePlaylist as renamePlaylistApi,
  savePlaylist as savePlaylistApi,
} from '@/api/playlists.api';
import { mapPlaylistSnapshot } from '@/components/widgets/floating-playlist/composables/helpers/map-playlist-snapshot.helper';
import { useToast } from '@/composables/use-toast';
import { i18n } from '@/i18n/i18n';
import { getPersistentSocketSessionId } from '@/stores/helpers/socket/get-persistent-socket-session-id.helper';
import type { VideoGalleryItem } from '@/types/harness-response-data.model';

import type { Playlist } from './playlist.types';

const SESSION_ID = getPersistentSocketSessionId();

const ACTIVE_PLAYLIST_STORAGE_KEY = 'vision-active-playlist';

function loadActivePlaylist(): string {
  try {
    return localStorage.getItem(ACTIVE_PLAYLIST_STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

/**
 * All playlists for the session. The playlist is global: the panel shows
 * every playlist, and the active playlist is the queue. Playlists are
 * persisted to the database keyed by (sessionId, name), so names are unique
 * per session.
 */
export const usePlaylistStore = defineStore('playlist', () => {
  const toast = useToast();

  const playlists = ref<Playlist[]>([]);
  /** Name of the active playlist (global across the session). */
  const activePlaylistName = ref<string>(loadActivePlaylist());

  function persistActivePlaylist() {
    try {
      localStorage.setItem(
        ACTIVE_PLAYLIST_STORAGE_KEY,
        activePlaylistName.value,
      );
    } catch {
      /* storage unavailable — the selection stays in-memory only */
    }
  }

  function getPlaylists(): Playlist[] {
    return playlists.value;
  }

  function getActivePlaylist(): Playlist | null {
    return (
      playlists.value.find((p) => p.name === activePlaylistName.value) ?? null
    );
  }

  function getActivePlaylistVideos(): VideoGalleryItem[] {
    return getActivePlaylist()?.videos ?? [];
  }

  function isVideoInActivePlaylist(videoUrl: string): boolean {
    return (
      getActivePlaylist()?.videos.some(
        (video) => video.videoUrl === videoUrl,
      ) ?? false
    );
  }

  function setPlaylists(next: Playlist[]) {
    playlists.value = next;
  }

  function setActivePlaylist(name: string) {
    activePlaylistName.value = name;
    persistActivePlaylist();
  }

  /**
   * Monotonic counter bumped on every local playlist mutation. A
   * `loadPlaylists` fetch that started before a mutation must not clobber the
   * newer in-memory state with a stale server snapshot.
   */
  let playlistMutationCount = 0;

  /** In-flight `loadPlaylists` fetch: concurrent callers share one request. */
  let playlistsFetchInFlight: Promise<void> | null = null;

  function markMutation() {
    playlistMutationCount += 1;
  }

  /** Load all playlists for the session, restoring the active playlist
   * (defaulting to the first one). Concurrent calls share one fetch. */
  async function loadPlaylists(): Promise<void> {
    if (playlistsFetchInFlight) return playlistsFetchInFlight;
    const promise = (async () => {
      const mutationAtStart = playlistMutationCount;
      const fetched = await fetchAllPlaylists(SESSION_ID);
      // Discard the snapshot if the playlist state changed while we were
      // fetching — the caller holds fresher data.
      if (playlistMutationCount !== mutationAtStart) return;
      const next = fetched.map(mapPlaylistSnapshot);
      setPlaylists(next);
      if (!activePlaylistName.value && next.length > 0) {
        setActivePlaylist(next[0].name);
      }
    })().finally(() => {
      playlistsFetchInFlight = null;
    });
    playlistsFetchInFlight = promise;
    return promise;
  }

  /** Persist a playlist, surfacing a toast if the save fails (never silent). */
  function persistPlaylist(playlist: Playlist) {
    savePlaylistApi(
      SESSION_ID,
      playlist.name,
      playlist.videos as unknown as Array<Record<string, unknown>>,
    ).catch(() => {
      toast.error(
        i18n.global.t('toast.couldNotSavePlaylist', { name: playlist.name }),
      );
    });
  }

  /** Add a video to the active playlist (deduped by URL), persisting it. */
  function addVideoToActivePlaylist(video: VideoGalleryItem) {
    const active = getActivePlaylist();
    if (!active || !video.videoUrl) return;
    if (active.videos.some((item) => item.videoUrl === video.videoUrl)) return;
    active.videos = [...active.videos, video];
    markMutation();
    persistPlaylist(active);
  }

  /** Remove a video from the active playlist, persisting it. */
  function removeVideoFromActivePlaylist(videoUrl: string) {
    const active = getActivePlaylist();
    if (!active) return;
    active.videos = active.videos.filter((item) => item.videoUrl !== videoUrl);
    markMutation();
    persistPlaylist(active);
  }

  /** Create a new empty playlist and make it active, persisting it. */
  function createPlaylist(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (playlists.value.some((p) => p.name === trimmed)) return;
    const playlist: Playlist = { name: trimmed, videos: [] };
    setPlaylists([...playlists.value, playlist]);
    setActivePlaylist(trimmed);
    markMutation();
    persistPlaylist(playlist);
  }

  /** Rename a playlist, persisting it. Returns false on a taken name. */
  function renamePlaylist(oldName: string, newName: string): boolean {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) return false;
    if (playlists.value.some((p) => p.name === trimmed)) return false;
    const playlist = playlists.value.find((p) => p.name === oldName);
    if (!playlist) return false;

    const renamed: Playlist = { ...playlist, name: trimmed };
    setPlaylists(
      playlists.value.map((p) => (p.name === oldName ? renamed : p)),
    );
    if (activePlaylistName.value === oldName) setActivePlaylist(trimmed);
    markMutation();
    renamePlaylistApi(SESSION_ID, oldName, trimmed).catch(() => {
      toast.error(
        i18n.global.t('toast.couldNotRenamePlaylist', { name: oldName }),
      );
    });
    return true;
  }

  /** Delete a playlist, persisting it. The active playlist falls back to the
   * first remaining one, or none. */
  function deletePlaylist(name: string) {
    const playlist = playlists.value.find((p) => p.name === name);
    const next = playlists.value.filter((p) => p.name !== name);
    setPlaylists(next);
    if (activePlaylistName.value === name) {
      setActivePlaylist(next[0]?.name ?? '');
    }
    if (playlist) {
      markMutation();
      deletePlaylistApi(SESSION_ID, name).catch(() => {
        toast.error(i18n.global.t('toast.couldNotDeletePlaylist', { name }));
      });
    }
  }

  /** Select a playlist as active (loads its videos into the queue). */
  function selectPlaylist(name: string) {
    if (!playlists.value.some((p) => p.name === name)) return;
    setActivePlaylist(name);
  }

  return {
    playlists,
    activePlaylistName,
    getPlaylists,
    getActivePlaylist,
    getActivePlaylistVideos,
    isVideoInActivePlaylist,
    setPlaylists,
    setActivePlaylist,
    loadPlaylists,
    addVideoToActivePlaylist,
    removeVideoFromActivePlaylist,
    createPlaylist,
    renamePlaylist,
    deletePlaylist,
    selectPlaylist,
  };
});
