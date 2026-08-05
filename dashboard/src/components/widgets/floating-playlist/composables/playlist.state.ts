import { ref } from 'vue';

import {
  deletePlaylist as deletePlaylistApi,
  fetchAllPlaylists,
  renamePlaylist as renamePlaylistApi,
  savePlaylist as savePlaylistApi,
} from '@/api/playlists.api';
import { getPersistentSocketSessionId } from '@/stores/helpers/get-persistent-socket-session-id.helper';
import type { VideoGalleryItem } from '@/types/harness-response-data.model';

const SESSION_ID = getPersistentSocketSessionId();

export interface Playlist {
  name: string;
  videos: VideoGalleryItem[];
  /** Conversation the playlist belongs to (part of the DB compound key). */
  conversationId: string;
}

/**
 * All playlists for the session, across conversations. The playlist is
 * global: the panel shows every playlist, and the active playlist is the
 * queue. Playlists are persisted to the database keyed by
 * (sessionId, conversationId, name) — the compound key only prevents
 * duplicates; the panel reads them all by sessionId.
 */
export const playlists = ref<Playlist[]>([]);

const ACTIVE_PLAYLIST_STORAGE_KEY = 'vision-active-playlist';

function loadActivePlaylist(): string {
  try {
    return localStorage.getItem(ACTIVE_PLAYLIST_STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

function persistActivePlaylist() {
  try {
    localStorage.setItem(ACTIVE_PLAYLIST_STORAGE_KEY, activePlaylistName.value);
  } catch {
    /* storage unavailable — the selection stays in-memory only */
  }
}

/** Name of the active playlist (global across the session). */
export const activePlaylistName = ref<string>(loadActivePlaylist());

export function getPlaylists(): Playlist[] {
  return playlists.value;
}

export function getActivePlaylist(): Playlist | null {
  return (
    playlists.value.find((p) => p.name === activePlaylistName.value) ?? null
  );
}

export function getActivePlaylistVideos(): VideoGalleryItem[] {
  return getActivePlaylist()?.videos ?? [];
}

export function isVideoInActivePlaylist(videoUrl: string): boolean {
  return (
    getActivePlaylist()?.videos.some((video) => video.videoUrl === videoUrl) ??
    false
  );
}

export function setPlaylists(next: Playlist[]) {
  playlists.value = next;
}

export function setActivePlaylist(name: string) {
  activePlaylistName.value = name;
  persistActivePlaylist();
}

/** Load all playlists for the session, restoring the active playlist
 *  (defaulting to the first one). */
export async function loadPlaylists() {
  const fetched = await fetchAllPlaylists(SESSION_ID);
  setPlaylists(fetched);
  if (!activePlaylistName.value && fetched.length > 0) {
    setActivePlaylist(fetched[0].name);
  }
}

function persistPlaylist(playlist: Playlist) {
  void savePlaylistApi(
    SESSION_ID,
    playlist.conversationId,
    playlist.name,
    playlist.videos as Array<Record<string, unknown>>,
  );
}

/** Add a video to the active playlist (deduped by URL), persisting it. */
export function addVideoToActivePlaylist(video: VideoGalleryItem) {
  const active = getActivePlaylist();
  if (!active || !video.videoUrl) return;
  if (active.videos.some((item) => item.videoUrl === video.videoUrl)) return;
  active.videos = [...active.videos, video];
  persistPlaylist(active);
}

/** Remove a video from the active playlist, persisting it. */
export function removeVideoFromActivePlaylist(videoUrl: string) {
  const active = getActivePlaylist();
  if (!active) return;
  active.videos = active.videos.filter((item) => item.videoUrl !== videoUrl);
  persistPlaylist(active);
}

/** Create a new empty playlist and make it active, persisting it. */
export function createPlaylist(conversationId: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) return;
  if (playlists.value.some((p) => p.name === trimmed)) return;
  const playlist: Playlist = { name: trimmed, videos: [], conversationId };
  setPlaylists([...playlists.value, playlist]);
  setActivePlaylist(trimmed);
  persistPlaylist(playlist);
}

/** Rename a playlist, persisting it. Returns false on a taken name. */
export function renamePlaylist(oldName: string, newName: string): boolean {
  const trimmed = newName.trim();
  if (!trimmed || trimmed === oldName) return false;
  if (playlists.value.some((p) => p.name === trimmed)) return false;
  const playlist = playlists.value.find((p) => p.name === oldName);
  if (!playlist) return false;

  const renamed: Playlist = { ...playlist, name: trimmed };
  setPlaylists(playlists.value.map((p) => (p.name === oldName ? renamed : p)));
  if (activePlaylistName.value === oldName) setActivePlaylist(trimmed);
  void renamePlaylistApi(SESSION_ID, playlist.conversationId, oldName, trimmed);
  return true;
}

/** Delete a playlist, persisting it. The active playlist falls back to the
 *  first remaining one, or none. */
export function deletePlaylist(name: string) {
  const playlist = playlists.value.find((p) => p.name === name);
  const next = playlists.value.filter((p) => p.name !== name);
  setPlaylists(next);
  if (activePlaylistName.value === name) {
    setActivePlaylist(next[0]?.name ?? '');
  }
  if (playlist) {
    void deletePlaylistApi(SESSION_ID, playlist.conversationId, name);
  }
}

/** Select a playlist as active (loads its videos into the queue). */
export function selectPlaylist(name: string) {
  if (!playlists.value.some((p) => p.name === name)) return;
  setActivePlaylist(name);
}
