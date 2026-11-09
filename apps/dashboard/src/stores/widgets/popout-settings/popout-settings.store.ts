import { defineStore } from 'pinia';
import { ref } from 'vue';

import { loadBooleanSetting } from '@/utils/load-boolean-setting/load-boolean-setting.helper';
import { saveBooleanSetting } from '@/utils/save-boolean-setting/save-boolean-setting.helper';

import { parsePopoutAnchor } from './helpers/parse-popout-anchor.helper';
import {
  DEFAULT_POPOUT_ANCHOR,
  DEFAULT_POPOUT_AUTO_DOCK,
  DEFAULT_POPOUT_ENABLED,
  DEFAULT_POPOUT_HIDE_ON_PLAYLIST,
  DEFAULT_POPOUT_REMEMBER_POSITION,
  DEFAULT_POPOUT_SHOW_BAR_ALWAYS,
  POPOUT_ANCHOR_STORAGE_KEY,
  POPOUT_AUTO_DOCK_STORAGE_KEY,
  POPOUT_ENABLED_STORAGE_KEY,
  POPOUT_HIDE_ON_PLAYLIST_STORAGE_KEY,
  POPOUT_REMEMBER_POSITION_STORAGE_KEY,
  POPOUT_SHOW_BAR_ALWAYS_STORAGE_KEY,
} from './popout-settings.constant';
import type { PopoutAnchor } from './popout-settings.types';

/** Persisted preferences for floating video popouts. */
export const usePopoutSettingsStore = defineStore('popoutSettings', () => {
  const popoutEnabled = ref<boolean>(
    loadBooleanSetting(POPOUT_ENABLED_STORAGE_KEY, DEFAULT_POPOUT_ENABLED),
  );

  const popoutAnchor = ref<PopoutAnchor>(DEFAULT_POPOUT_ANCHOR);

  try {
    popoutAnchor.value = parsePopoutAnchor(
      localStorage.getItem(POPOUT_ANCHOR_STORAGE_KEY),
    );
  } catch {
    /* Storage unavailable: retain the default anchor. */
  }

  const popoutRememberPosition = ref<boolean>(
    loadBooleanSetting(
      POPOUT_REMEMBER_POSITION_STORAGE_KEY,
      DEFAULT_POPOUT_REMEMBER_POSITION,
    ),
  );

  const popoutHideOnPlaylist = ref<boolean>(
    loadBooleanSetting(
      POPOUT_HIDE_ON_PLAYLIST_STORAGE_KEY,
      DEFAULT_POPOUT_HIDE_ON_PLAYLIST,
    ),
  );

  const popoutAutoDock = ref<boolean>(
    loadBooleanSetting(POPOUT_AUTO_DOCK_STORAGE_KEY, DEFAULT_POPOUT_AUTO_DOCK),
  );

  const popoutShowBarAlways = ref<boolean>(
    loadBooleanSetting(
      POPOUT_SHOW_BAR_ALWAYS_STORAGE_KEY,
      DEFAULT_POPOUT_SHOW_BAR_ALWAYS,
    ),
  );

  function setPopoutEnabled(enabled: boolean): void {
    popoutEnabled.value = enabled;
    saveBooleanSetting(POPOUT_ENABLED_STORAGE_KEY, enabled);
  }

  function setPopoutAnchor(anchor: PopoutAnchor): void {
    popoutAnchor.value = anchor;
    try {
      localStorage.setItem(POPOUT_ANCHOR_STORAGE_KEY, anchor);
    } catch {
      /* Storage unavailable: retain the preference in memory. */
    }
  }

  function setPopoutRememberPosition(enabled: boolean): void {
    popoutRememberPosition.value = enabled;
    saveBooleanSetting(POPOUT_REMEMBER_POSITION_STORAGE_KEY, enabled);
  }

  function setPopoutHideOnPlaylist(enabled: boolean): void {
    popoutHideOnPlaylist.value = enabled;
    saveBooleanSetting(POPOUT_HIDE_ON_PLAYLIST_STORAGE_KEY, enabled);
  }

  function setPopoutAutoDock(enabled: boolean): void {
    popoutAutoDock.value = enabled;
    saveBooleanSetting(POPOUT_AUTO_DOCK_STORAGE_KEY, enabled);
  }

  function setPopoutShowBarAlways(enabled: boolean): void {
    popoutShowBarAlways.value = enabled;
    saveBooleanSetting(POPOUT_SHOW_BAR_ALWAYS_STORAGE_KEY, enabled);
  }

  function resetPopoutSettings(): void {
    setPopoutEnabled(DEFAULT_POPOUT_ENABLED);
    setPopoutAnchor(DEFAULT_POPOUT_ANCHOR);
    setPopoutRememberPosition(DEFAULT_POPOUT_REMEMBER_POSITION);
    setPopoutHideOnPlaylist(DEFAULT_POPOUT_HIDE_ON_PLAYLIST);
    setPopoutAutoDock(DEFAULT_POPOUT_AUTO_DOCK);
    setPopoutShowBarAlways(DEFAULT_POPOUT_SHOW_BAR_ALWAYS);
  }

  return {
    popoutEnabled,
    popoutAnchor,
    popoutRememberPosition,
    popoutHideOnPlaylist,
    popoutAutoDock,
    popoutShowBarAlways,
    setPopoutEnabled,
    setPopoutAnchor,
    setPopoutRememberPosition,
    setPopoutHideOnPlaylist,
    setPopoutAutoDock,
    setPopoutShowBarAlways,
    resetPopoutSettings,
  };
});
