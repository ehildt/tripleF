import { ref } from 'vue';

/** Position where a floating video popout initially appears. */
export type PopoutAnchor =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'middle-left'
  | 'middle-center'
  | 'middle-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export interface FloatingPopupRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const DEFAULT_POPOUT_ANCHOR: PopoutAnchor = 'bottom-right';
export const DEFAULT_POPOUT_REMEMBER_POSITION = true;
export const DEFAULT_POPOUT_ENABLED = true;
export const DEFAULT_POPOUT_HIDE_ON_PLAYLIST = false;
export const DEFAULT_POPOUT_AUTO_DOCK = true;

const POPOUT_ENABLED_STORAGE_KEY = 'vision-popout-enabled';
const POPOUT_ANCHOR_STORAGE_KEY = 'vision-popout-anchor';
const POPOUT_REMEMBER_POSITION_STORAGE_KEY = 'vision-popout-remember-position';
const POPOUT_RECT_STORAGE_KEY = 'vision-popout-rect';
const POPOUT_HIDE_ON_PLAYLIST_STORAGE_KEY = 'vision-popout-hide-on-playlist';
const POPOUT_AUTO_DOCK_STORAGE_KEY = 'vision-popout-auto-dock';

const POPOUT_ANCHORS: readonly PopoutAnchor[] = [
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

function loadPopoutEnabled(): boolean {
  return loadBoolean(POPOUT_ENABLED_STORAGE_KEY, DEFAULT_POPOUT_ENABLED);
}

function loadBoolean(key: string, fallback: boolean): boolean {
  try {
    const saved = localStorage.getItem(key);
    return saved === null ? fallback : saved === 'true';
  } catch {
    return fallback;
  }
}

function loadPopoutAnchor(): PopoutAnchor {
  try {
    const saved = localStorage.getItem(POPOUT_ANCHOR_STORAGE_KEY);
    return POPOUT_ANCHORS.includes(saved as PopoutAnchor)
      ? (saved as PopoutAnchor)
      : DEFAULT_POPOUT_ANCHOR;
  } catch {
    return DEFAULT_POPOUT_ANCHOR;
  }
}

function loadRememberPosition(): boolean {
  try {
    const saved = localStorage.getItem(POPOUT_REMEMBER_POSITION_STORAGE_KEY);
    return saved === null ? DEFAULT_POPOUT_REMEMBER_POSITION : saved === 'true';
  } catch {
    return DEFAULT_POPOUT_REMEMBER_POSITION;
  }
}

function loadFloatingPopupRect(): FloatingPopupRect | null {
  try {
    const raw = localStorage.getItem(POPOUT_RECT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FloatingPopupRect) : null;
  } catch {
    return null;
  }
}

/**
 * Popout settings, shared module state: the corner a floating video popout
 * initially appears in, and whether a moved popout position is remembered —
 * across players, conversations, and (persisted) app reloads. Configured in
 * SysCtl → Popout.
 */
/** Whether scrolled-out videos may float as a popup at all. */
export const popoutEnabled = ref<boolean>(loadPopoutEnabled());
export const popoutAnchor = ref<PopoutAnchor>(loadPopoutAnchor());
export const popoutRememberPosition = ref(loadRememberPosition());

/**
 * Hide the floating popup while playlist videos play: the launch machinery
 * (player, queue, autoplay) keeps running — only the window is suppressed,
 * so the playlist becomes a background player driven by the transport bar.
 */
export const popoutHideOnPlaylist = ref<boolean>(
  loadBoolean(
    POPOUT_HIDE_ON_PLAYLIST_STORAGE_KEY,
    DEFAULT_POPOUT_HIDE_ON_PLAYLIST,
  ),
);

/**
 * Dock a floated popout automatically when its figure scrolls back into
 * view. When off, the popout stays floating until the user docks or closes
 * it manually.
 */
export const popoutAutoDock = ref<boolean>(
  loadBoolean(POPOUT_AUTO_DOCK_STORAGE_KEY, DEFAULT_POPOUT_AUTO_DOCK),
);

/** Example popout shown from SysCtl → Widgets to preview the anchor. */
export const popoutPreviewVisible = ref(false);

let popoutPreviewTimer: ReturnType<typeof setTimeout> | null = null;

const POPOUT_PREVIEW_DURATION_MS = 3000;

export function showPopoutPreview() {
  popoutPreviewVisible.value = true;
  if (popoutPreviewTimer) clearTimeout(popoutPreviewTimer);
  popoutPreviewTimer = setTimeout(() => {
    popoutPreviewVisible.value = false;
    popoutPreviewTimer = null;
  }, POPOUT_PREVIEW_DURATION_MS);
}

export function hidePopoutPreview() {
  popoutPreviewVisible.value = false;
  if (popoutPreviewTimer) {
    clearTimeout(popoutPreviewTimer);
    popoutPreviewTimer = null;
  }
}

/**
 * Last geometry of the floating video popup. Hydrated from localStorage when
 * position memory is on, so a popout reappears where the user last moved it.
 * Null when no position is remembered — the initial anchor applies.
 */
export const floatingPopupRect = ref<FloatingPopupRect | null>(
  popoutRememberPosition.value ? loadFloatingPopupRect() : null,
);

export function setPopoutEnabled(enabled: boolean) {
  popoutEnabled.value = enabled;
  try {
    localStorage.setItem(POPOUT_ENABLED_STORAGE_KEY, String(enabled));
  } catch {
    /* storage unavailable — the setting stays in-memory only */
  }
}

export function setPopoutAnchor(anchor: PopoutAnchor) {
  popoutAnchor.value = anchor;
  try {
    localStorage.setItem(POPOUT_ANCHOR_STORAGE_KEY, anchor);
  } catch {
    /* storage unavailable — the setting stays in-memory only */
  }
  // The new anchor takes effect on the next popout — drop any remembered spot.
  floatingPopupRect.value = null;
  try {
    localStorage.removeItem(POPOUT_RECT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function setPopoutRememberPosition(enabled: boolean) {
  popoutRememberPosition.value = enabled;
  try {
    localStorage.setItem(POPOUT_REMEMBER_POSITION_STORAGE_KEY, String(enabled));
  } catch {
    /* storage unavailable — the setting stays in-memory only */
  }
  if (!enabled) {
    floatingPopupRect.value = null;
    try {
      localStorage.removeItem(POPOUT_RECT_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }
}

export function setPopoutHideOnPlaylist(enabled: boolean) {
  popoutHideOnPlaylist.value = enabled;
  try {
    localStorage.setItem(POPOUT_HIDE_ON_PLAYLIST_STORAGE_KEY, String(enabled));
  } catch {
    /* storage unavailable — the setting stays in-memory only */
  }
}

export function setPopoutAutoDock(enabled: boolean) {
  popoutAutoDock.value = enabled;
  try {
    localStorage.setItem(POPOUT_AUTO_DOCK_STORAGE_KEY, String(enabled));
  } catch {
    /* storage unavailable — the setting stays in-memory only */
  }
}

/**
 * Persist the current popup geometry at the end of a drag/resize gesture —
 * only while position memory is on.
 */
export function rememberFloatingPopupRect() {
  if (!popoutRememberPosition.value || !floatingPopupRect.value) return;
  try {
    localStorage.setItem(
      POPOUT_RECT_STORAGE_KEY,
      JSON.stringify(floatingPopupRect.value),
    );
  } catch {
    /* storage full or unavailable — the position stays in-memory only */
  }
}

/**
 * Drop the live popup position when a popout closes and position memory is
 * off, so the next popout opens at the configured initial anchor.
 */
export function releaseFloatingPopupRect() {
  if (popoutRememberPosition.value) return;
  floatingPopupRect.value = null;
}

/** Restore the popout settings to their defaults and forget any position. */
export function resetPopoutSettings() {
  setPopoutEnabled(DEFAULT_POPOUT_ENABLED);
  floatingPopupRect.value = null;
  try {
    localStorage.removeItem(POPOUT_RECT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
  setPopoutAnchor(DEFAULT_POPOUT_ANCHOR);
  setPopoutRememberPosition(DEFAULT_POPOUT_REMEMBER_POSITION);
  setPopoutHideOnPlaylist(DEFAULT_POPOUT_HIDE_ON_PLAYLIST);
  setPopoutAutoDock(DEFAULT_POPOUT_AUTO_DOCK);
}
