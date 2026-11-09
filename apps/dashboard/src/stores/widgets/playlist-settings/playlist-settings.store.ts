import { defineStore } from 'pinia';
import { ref } from 'vue';

import { loadBooleanSetting } from '@/utils/load-boolean-setting/load-boolean-setting.helper';
import { saveBooleanSetting } from '@/utils/save-boolean-setting/save-boolean-setting.helper';

import { parsePlaylistAnchor } from './helpers/parse-playlist-anchor.helper';
import { parsePlaylistMode } from './helpers/parse-playlist-mode.helper';
import {
  DEFAULT_PLAYLIST_ANCHOR,
  DEFAULT_PLAYLIST_AUTO_CLOSE,
  DEFAULT_PLAYLIST_MODE,
  PLAYLIST_ANCHOR_STORAGE_KEY,
  PLAYLIST_AUTO_CLOSE_STORAGE_KEY,
  PLAYLIST_MODE_STORAGE_KEY,
} from './playlist-settings.constant';
import type { PlaylistAnchor, PlaylistMode } from './playlist-settings.types';

/** Persisted presentation preferences for the playlist widget. */
export const usePlaylistSettingsStore = defineStore('playlistSettings', () => {
  const playlistMode = ref<PlaylistMode>(DEFAULT_PLAYLIST_MODE);
  try {
    playlistMode.value = parsePlaylistMode(
      localStorage.getItem(PLAYLIST_MODE_STORAGE_KEY),
    );
  } catch {
    /* Storage unavailable: retain the default mode. */
  }

  const playlistAnchor = ref<PlaylistAnchor>(DEFAULT_PLAYLIST_ANCHOR);
  try {
    playlistAnchor.value = parsePlaylistAnchor(
      localStorage.getItem(PLAYLIST_ANCHOR_STORAGE_KEY),
    );
  } catch {
    /* Storage unavailable: retain the default anchor. */
  }

  const playlistAutoClose = ref<boolean>(
    loadBooleanSetting(
      PLAYLIST_AUTO_CLOSE_STORAGE_KEY,
      DEFAULT_PLAYLIST_AUTO_CLOSE,
    ),
  );

  function setPlaylistMode(mode: PlaylistMode): void {
    playlistMode.value = mode;
    try {
      localStorage.setItem(PLAYLIST_MODE_STORAGE_KEY, mode);
    } catch {
      /* Storage unavailable: retain the preference in memory. */
    }
  }

  function setPlaylistAnchor(anchor: PlaylistAnchor): void {
    playlistAnchor.value = anchor;
    try {
      localStorage.setItem(PLAYLIST_ANCHOR_STORAGE_KEY, anchor);
    } catch {
      /* Storage unavailable: retain the preference in memory. */
    }
  }

  function setPlaylistAutoClose(enabled: boolean): void {
    playlistAutoClose.value = enabled;
    saveBooleanSetting(PLAYLIST_AUTO_CLOSE_STORAGE_KEY, enabled);
  }

  function resetPlaylistSettings(): void {
    setPlaylistMode(DEFAULT_PLAYLIST_MODE);
    setPlaylistAnchor(DEFAULT_PLAYLIST_ANCHOR);
    setPlaylistAutoClose(DEFAULT_PLAYLIST_AUTO_CLOSE);
  }

  return {
    playlistMode,
    playlistAnchor,
    playlistAutoClose,
    setPlaylistMode,
    setPlaylistAnchor,
    setPlaylistAutoClose,
    resetPlaylistSettings,
  };
});
