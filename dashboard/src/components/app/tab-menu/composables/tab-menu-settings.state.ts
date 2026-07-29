import { ref } from 'vue';

/** Screen edge the slide-out tab menu is docked to. */
export type TabMenuSide = 'left' | 'right';

export const DEFAULT_TAB_MENU_SIDE: TabMenuSide = 'right';
export const DEFAULT_TAB_MENU_AUTO_CLOSE = false;

const TAB_MENU_SIDE_STORAGE_KEY = 'vision-tab-menu-side';
const TAB_MENU_AUTO_CLOSE_STORAGE_KEY = 'vision-tab-menu-auto-close';

const TAB_MENU_SIDES: readonly TabMenuSide[] = ['left', 'right'];

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
 * Tab menu settings, shared module state: the screen edge the slide-out
 * menu is docked to, and whether it closes itself after the user picked a
 * tab or clicked elsewhere (autoclose) — off keeps it toggled by hand.
 * Configured in SysCtl → Widgets.
 */
export const tabMenuSide = ref<TabMenuSide>(loadTabMenuSide());
export const tabMenuAutoClose = ref<boolean>(
  loadBoolean(TAB_MENU_AUTO_CLOSE_STORAGE_KEY, DEFAULT_TAB_MENU_AUTO_CLOSE),
);

export function setTabMenuSide(side: TabMenuSide) {
  tabMenuSide.value = side;
  try {
    localStorage.setItem(TAB_MENU_SIDE_STORAGE_KEY, side);
  } catch {
    /* storage unavailable — the setting stays in-memory only */
  }
}

export function setTabMenuAutoClose(enabled: boolean) {
  tabMenuAutoClose.value = enabled;
  saveBoolean(TAB_MENU_AUTO_CLOSE_STORAGE_KEY, enabled);
}

/** Restore the tab menu settings to their defaults. */
export function resetTabMenuSettings() {
  setTabMenuSide(DEFAULT_TAB_MENU_SIDE);
  setTabMenuAutoClose(DEFAULT_TAB_MENU_AUTO_CLOSE);
}
