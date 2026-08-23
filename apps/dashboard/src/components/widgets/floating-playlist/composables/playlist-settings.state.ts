import { ref } from 'vue';

import { getActivePlaylistVideos, getPlaylists } from './playlist.state';
import type {
  PlaylistAnchor,
  PlaylistMode,
} from './playlist-settings.state.types';

export const DEFAULT_PLAYLIST_MODE: PlaylistMode = 'panel';
export const DEFAULT_PLAYLIST_ANCHOR: PlaylistAnchor = 'middle-right';
export const DEFAULT_PLAYLIST_AUTO_CLOSE = false;

const PLAYLIST_MODE_STORAGE_KEY = 'vision-playlist-mode';
const PLAYLIST_ANCHOR_STORAGE_KEY = 'vision-playlist-anchor';
const PLAYLIST_AUTO_CLOSE_STORAGE_KEY = 'vision-playlist-auto-close';

const PLAYLIST_ANCHORS: readonly PlaylistAnchor[] = [
  'top-left',
  'top-center',
  'top-right',
  'middle-left',
  'middle-center',
  'middle-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
];

function loadBoolean(key: string, fallback: boolean): boolean {
  try {
    const saved = localStorage.getItem(key);
    return saved === null ? fallback : saved === 'true';
  } catch {
    return fallback;
  }
}

function saveBoolean(key: string, value: boolean): void {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    /* storage unavailable — the setting stays in-memory only */
  }
}

function loadPlaylistMode(): PlaylistMode {
  try {
    const saved = localStorage.getItem(PLAYLIST_MODE_STORAGE_KEY);
    return saved === 'floating' ? 'floating' : DEFAULT_PLAYLIST_MODE;
  } catch {
    return DEFAULT_PLAYLIST_MODE;
  }
}

function loadPlaylistAnchor(): PlaylistAnchor {
  try {
    const saved = localStorage.getItem(PLAYLIST_ANCHOR_STORAGE_KEY);
    return PLAYLIST_ANCHORS.includes(saved as PlaylistAnchor)
      ? (saved as PlaylistAnchor)
      : DEFAULT_PLAYLIST_ANCHOR;
  } catch {
    return DEFAULT_PLAYLIST_ANCHOR;
  }
}

/**
 * Playlist widget settings, shared module state. The mode decides whether
 * the playlist renders in the chat right panel or as an app-level floating
 * window; the anchor fixes its position (it is not draggable — a same-side
 * top anchor stacks below the tab menu, see use-floating-playlist-geometry),
 * and autoclose mirrors the tab menu. Configured in SysCtl → Widgets →
 * Playlist.
 */
export const playlistMode = ref<PlaylistMode>(loadPlaylistMode());
export const playlistAnchor = ref<PlaylistAnchor>(loadPlaylistAnchor());
export const playlistAutoClose = ref<boolean>(
  loadBoolean(PLAYLIST_AUTO_CLOSE_STORAGE_KEY, DEFAULT_PLAYLIST_AUTO_CLOSE),
);

/**
 * Whether the floating playlist window is open. Opens by default whenever it
 * holds anything to act on — a playlist or an added video — so the player is
 * visible when it has content, and only starts collapsed when there is
 * nothing in it. In-memory only.
 */
function loadFloatingPlaylistOpen(): boolean {
  return getPlaylists().length > 0 || getActivePlaylistVideos().length > 0;
}

export const floatingPlaylistOpen = ref(loadFloatingPlaylistOpen());

export function setPlaylistMode(mode: PlaylistMode) {
  playlistMode.value = mode;
  // Enabling floating mode surfaces the player window immediately — leaving
  // the compact handle alone reads as "the player disappeared".
  if (mode === 'floating') {
    floatingPlaylistOpen.value = true;
  }
  try {
    localStorage.setItem(PLAYLIST_MODE_STORAGE_KEY, mode);
  } catch {
    /* storage unavailable — the setting stays in-memory only */
  }
}

export function setPlaylistAnchor(anchor: PlaylistAnchor) {
  playlistAnchor.value = anchor;
  try {
    localStorage.setItem(PLAYLIST_ANCHOR_STORAGE_KEY, anchor);
  } catch {
    /* storage unavailable — the setting stays in-memory only */
  }
}

export function setPlaylistAutoClose(enabled: boolean) {
  playlistAutoClose.value = enabled;
  saveBoolean(PLAYLIST_AUTO_CLOSE_STORAGE_KEY, enabled);
}

/**
 * Example floating player shown from SysCtl → Widgets to preview the
 * configured anchor. Persistent (not timed); hides on tab switch or close.
 */
export const playlistPreviewVisible = ref(false);

export function togglePlaylistPreview() {
  playlistPreviewVisible.value = !playlistPreviewVisible.value;
}

export function hidePlaylistPreview() {
  playlistPreviewVisible.value = false;
}

/** Restore the playlist settings to their defaults. */
export function resetPlaylistSettings() {
  setPlaylistMode(DEFAULT_PLAYLIST_MODE);
  setPlaylistAnchor(DEFAULT_PLAYLIST_ANCHOR);
  setPlaylistAutoClose(DEFAULT_PLAYLIST_AUTO_CLOSE);
}
