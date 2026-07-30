import { ref } from 'vue';

import type { PopoutAnchor } from '@/components/chat/exchange-list/chat-exchange/exchange-content/assistant-response/composables/popout-settings.state';

/** Where the playlist lives: pinned inside the chat right panel, or an app-level floating window that survives tab switches. */
export type PlaylistMode = 'panel' | 'floating';

export type PlaylistAnchor = PopoutAnchor;

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
 * Whether the floating playlist window is open. Starts collapsed every
 * session — the compact handle stays at the anchor until the user opens
 * the window. In-memory only.
 */
export const floatingPlaylistOpen = ref(false);

export function setPlaylistMode(mode: PlaylistMode) {
  playlistMode.value = mode;
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

/** Restore the playlist settings to their defaults. */
export function resetPlaylistSettings() {
  setPlaylistMode(DEFAULT_PLAYLIST_MODE);
  setPlaylistAnchor(DEFAULT_PLAYLIST_ANCHOR);
  setPlaylistAutoClose(DEFAULT_PLAYLIST_AUTO_CLOSE);
}
