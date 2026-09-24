import { defineStore } from 'pinia';
import { ref } from 'vue';

import { usePlaylistStore } from './playlist';
import type { PlaylistAnchor, PlaylistMode } from './playlist-settings.types';

const DEFAULT_PLAYLIST_MODE: PlaylistMode = 'panel';
const DEFAULT_PLAYLIST_ANCHOR: PlaylistAnchor = 'top-right';
const DEFAULT_PLAYLIST_AUTO_CLOSE = false;

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
 * Playlist widget settings. The mode decides whether the playlist renders in
 * the chat right toolbar or as an app-level floating window; the anchor fixes
 * its position (it is not draggable — a same-side top anchor stacks below the
 * tab menu), and autoclose mirrors the tab menu. Configured in Settings →
 * Widgets → Playlist.
 */
export const usePlaylistSettingsStore = defineStore('playlist-settings', () => {
  const playlistStore = usePlaylistStore();

  const playlistMode = ref<PlaylistMode>(loadPlaylistMode());
  const playlistAnchor = ref<PlaylistAnchor>(loadPlaylistAnchor());
  const playlistAutoClose = ref<boolean>(
    loadBoolean(PLAYLIST_AUTO_CLOSE_STORAGE_KEY, DEFAULT_PLAYLIST_AUTO_CLOSE),
  );

  /**
   * Whether the floating playlist window is open. Opens by default whenever
   * it holds anything to act on — a playlist or an added video. In-memory
   * only.
   */
  const floatingPlaylistOpen = ref(
    playlistStore.getPlaylists().length > 0 ||
      playlistStore.getActivePlaylistVideos().length > 0,
  );

  /**
   * Example floating player shown from Settings → Widgets to preview the
   * configured anchor. Persistent (not timed); hides on tab switch or close.
   */
  const playlistPreviewVisible = ref(false);

  function setPlaylistMode(mode: PlaylistMode) {
    playlistMode.value = mode;
    // Enabling floating mode surfaces the player window immediately.
    if (mode === 'floating') {
      floatingPlaylistOpen.value = true;
    }
    try {
      localStorage.setItem(PLAYLIST_MODE_STORAGE_KEY, mode);
    } catch {
      /* storage unavailable — the setting stays in-memory only */
    }
  }

  function setPlaylistAnchor(anchor: PlaylistAnchor) {
    playlistAnchor.value = anchor;
    try {
      localStorage.setItem(PLAYLIST_ANCHOR_STORAGE_KEY, anchor);
    } catch {
      /* storage unavailable — the setting stays in-memory only */
    }
  }

  function setPlaylistAutoClose(enabled: boolean) {
    playlistAutoClose.value = enabled;
    saveBoolean(PLAYLIST_AUTO_CLOSE_STORAGE_KEY, enabled);
  }

  function togglePlaylistPreview() {
    playlistPreviewVisible.value = !playlistPreviewVisible.value;
  }

  function hidePlaylistPreview() {
    playlistPreviewVisible.value = false;
  }

  /** Restore the playlist settings to their defaults. */
  function resetPlaylistSettings() {
    setPlaylistMode(DEFAULT_PLAYLIST_MODE);
    setPlaylistAnchor(DEFAULT_PLAYLIST_ANCHOR);
    setPlaylistAutoClose(DEFAULT_PLAYLIST_AUTO_CLOSE);
  }

  return {
    playlistMode,
    playlistAnchor,
    playlistAutoClose,
    floatingPlaylistOpen,
    playlistPreviewVisible,
    setPlaylistMode,
    setPlaylistAnchor,
    setPlaylistAutoClose,
    togglePlaylistPreview,
    hidePlaylistPreview,
    resetPlaylistSettings,
  };
});
