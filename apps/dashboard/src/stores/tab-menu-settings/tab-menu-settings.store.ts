import { defineStore } from 'pinia';
import { ref } from 'vue';

import { loadBooleanSetting } from '@/utils/load-boolean-setting/load-boolean-setting.helper';
import { saveBooleanSetting } from '@/utils/save-boolean-setting/save-boolean-setting.helper';

import {
  DEFAULT_TAB_MENU_AUTO_CLOSE,
  DEFAULT_TAB_MENU_SIDE,
  TAB_MENU_AUTO_CLOSE_STORAGE_KEY,
  TAB_MENU_SIDE_STORAGE_KEY,
  TAB_MENU_SIDES,
} from './tab-menu-settings.constant';
import type { TabMenuSide } from './tab-menu-settings.types';

function loadTabMenuSide(): TabMenuSide {
  try {
    const saved = localStorage.getItem(TAB_MENU_SIDE_STORAGE_KEY);
    return TAB_MENU_SIDES.includes(saved as TabMenuSide)
      ? (saved as TabMenuSide)
      : DEFAULT_TAB_MENU_SIDE;
  } catch {
    return DEFAULT_TAB_MENU_SIDE;
  }
}

/**
 * Tab menu settings: the screen edge the slide-out menu is docked to, and
 * whether it closes itself after the user picked a tab or clicked elsewhere
 * (autoclose) — off keeps it toggled by hand. Configured in Settings →
 * Widgets.
 */
export const useTabMenuSettingsStore = defineStore('tab-menu-settings', () => {
  const tabMenuSide = ref<TabMenuSide>(loadTabMenuSide());
  const tabMenuAutoClose = ref<boolean>(
    loadBooleanSetting(
      TAB_MENU_AUTO_CLOSE_STORAGE_KEY,
      DEFAULT_TAB_MENU_AUTO_CLOSE,
    ),
  );

  function setTabMenuSide(side: TabMenuSide) {
    tabMenuSide.value = side;
    try {
      localStorage.setItem(TAB_MENU_SIDE_STORAGE_KEY, side);
    } catch {
      /* storage unavailable — the setting stays in-memory only */
    }
  }

  function setTabMenuAutoClose(enabled: boolean) {
    tabMenuAutoClose.value = enabled;
    saveBooleanSetting(TAB_MENU_AUTO_CLOSE_STORAGE_KEY, enabled);
  }

  /** Restore the tab menu settings to their defaults. */
  function resetTabMenuSettings() {
    setTabMenuSide(DEFAULT_TAB_MENU_SIDE);
    setTabMenuAutoClose(DEFAULT_TAB_MENU_AUTO_CLOSE);
  }

  return {
    tabMenuSide,
    tabMenuAutoClose,
    setTabMenuSide,
    setTabMenuAutoClose,
    resetTabMenuSettings,
  };
});
