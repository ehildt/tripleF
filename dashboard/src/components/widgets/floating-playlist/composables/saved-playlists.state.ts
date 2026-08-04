import { ref } from 'vue';

import type { VideoGalleryItem } from '@/types/harness-response-data.model';
import { createId } from '@/utils/id.helper';

/**
 * One named playlist the user saved from the floating playlist: an id, a
 * display name (unique — saving under an existing name overwrites), and the
 * captured videos in queue order.
 */
export interface SavedPlaylist {
  id: string;
  name: string;
  videos: VideoGalleryItem[];
}

const SAVED_PLAYLISTS_STORAGE_KEY = 'vision-saved-playlists';

export const MAX_SAVED_PLAYLISTS = 20;
export const MAX_SAVED_PLAYLIST_NAME_LENGTH = 40;

function loadSavedPlaylists(): SavedPlaylist[] {
  try {
    const raw = localStorage.getItem(SAVED_PLAYLISTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedPlaylist[];
    return Array.isArray(parsed)
      ? parsed.filter(
          (entry) => entry.id && entry.name && Array.isArray(entry.videos),
        )
      : [];
  } catch {
    return [];
  }
}

function persistSavedPlaylists() {
  try {
    localStorage.setItem(
      SAVED_PLAYLISTS_STORAGE_KEY,
      JSON.stringify(savedPlaylists.value),
    );
  } catch {
    /* storage full or unavailable — the playlists stay in-memory only */
  }
}

/**
 * Saved playlists, shared module state, persisted to localStorage. The
 * floating playlist names its current queue (save) and renames the saved
 * playlist by typing; emptying the name field deletes the saved playlist
 * and the queue is unnamed again. While a saved playlist is active
 * it mirrors the queue — loading one replaces the queue, and queue edits
 * sync back into it.
 */
export const savedPlaylists = ref<SavedPlaylist[]>(loadSavedPlaylists());

/**
 * The saved playlist the current queue belongs to, if any. Set on save and
 * on load, cleared when the playlist is deleted (the queue stays and
 * unnamed) or the conversation changes. In-memory only.
 */
export const activeSavedPlaylistId = ref<string | null>(null);

export function setActiveSavedPlaylist(id: string | null) {
  activeSavedPlaylistId.value = id;
}

/**
 * Save videos under a name. Saving under an existing name overwrites that
 * playlist in place and marks it active. An empty queue is allowed — the
 * user can create a playlist first and add items to it later. Returns the
 * saved entry, or null when the name is empty or the playlist limit is
 * reached.
 */
export function savePlaylist(
  name: string,
  videos: VideoGalleryItem[],
): SavedPlaylist | null {
  const trimmed = name.trim().slice(0, MAX_SAVED_PLAYLIST_NAME_LENGTH);
  if (!trimmed) return null;

  const existing = savedPlaylists.value.find((entry) => entry.name === trimmed);
  if (existing) {
    existing.videos = [...videos];
    activeSavedPlaylistId.value = existing.id;
    persistSavedPlaylists();
    return existing;
  }

  if (savedPlaylists.value.length >= MAX_SAVED_PLAYLISTS) return null;

  const entry: SavedPlaylist = {
    id: createId(),
    name: trimmed,
    videos: [...videos],
  };
  savedPlaylists.value = [...savedPlaylists.value, entry];
  activeSavedPlaylistId.value = entry.id;
  persistSavedPlaylists();
  return entry;
}

/**
 * Rename a saved playlist. Returns the renamed entry, or null for an
 * unknown id, an empty name, an unchanged name, or a name already taken by
 * another playlist.
 */
export function renameSavedPlaylist(
  id: string,
  name: string,
): SavedPlaylist | null {
  const trimmed = name.trim().slice(0, MAX_SAVED_PLAYLIST_NAME_LENGTH);
  const entry = savedPlaylists.value.find((playlist) => playlist.id === id);
  if (!entry || !trimmed || entry.name === trimmed) return null;
  if (savedPlaylists.value.some((playlist) => playlist.name === trimmed)) {
    return null;
  }
  entry.name = trimmed;
  persistSavedPlaylists();
  return entry;
}

/**
 * Mirror the queue into the active saved playlist. No-op without an active
 * playlist (unnamed queue); a dangling active id — the playlist was
 * deleted elsewhere — clears itself.
 */
export function syncActiveSavedPlaylist(videos: VideoGalleryItem[]) {
  if (!activeSavedPlaylistId.value) return;
  const entry = savedPlaylists.value.find(
    (playlist) => playlist.id === activeSavedPlaylistId.value,
  );
  if (!entry) {
    activeSavedPlaylistId.value = null;
    return;
  }
  entry.videos = [...videos];
  persistSavedPlaylists();
}

/** Delete a saved playlist by id, clearing its active mark. No-op for unknown ids. */
export function deleteSavedPlaylist(id: string): void {
  const next = savedPlaylists.value.filter((entry) => entry.id !== id);
  if (next.length === savedPlaylists.value.length) return;
  savedPlaylists.value = next;
  if (activeSavedPlaylistId.value === id) activeSavedPlaylistId.value = null;
  persistSavedPlaylists();
}
