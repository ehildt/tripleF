import { ref } from 'vue';

import type { ToastType } from '@/types/toast-type.model';

import type {
  ToastAnchor,
  ToastTypeFilters,
} from './toast-settings.state.types';

export const DEFAULT_TOAST_ENABLED = true;
export const DEFAULT_TOAST_ANCHOR: ToastAnchor = 'bottom-right';
export const DEFAULT_TOAST_AUTO_HIDE = true;
export const DEFAULT_TOAST_DURATION_SECONDS = 3;
export const DEFAULT_TOAST_PIN_ENABLED = true;
/** Only warning and error toasts are on by default — the rest are opt-in. */
export const DEFAULT_TOAST_TYPE_FILTERS: ToastTypeFilters = {
  info: false,
  success: false,
  warning: true,
  error: true,
  debug: false,
  default: false,
};

const TOAST_ENABLED_STORAGE_KEY = 'vision-toast-enabled';
const TOAST_ANCHOR_STORAGE_KEY = 'vision-toast-anchor';
const TOAST_AUTO_HIDE_STORAGE_KEY = 'vision-toast-auto-hide';
const TOAST_DURATION_SECONDS_STORAGE_KEY = 'vision-toast-duration-seconds';
const TOAST_PIN_ENABLED_STORAGE_KEY = 'vision-toast-pin-enabled';
const TOAST_TYPE_FILTERS_STORAGE_KEY = 'vision-toast-type-filters';

const TOAST_ANCHORS: readonly ToastAnchor[] = [
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

const TOAST_TYPES: readonly ToastType[] = [
  'info',
  'success',
  'warning',
  'error',
  'debug',
  'default',
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

function loadToastAnchor(): ToastAnchor {
  try {
    const saved = localStorage.getItem(TOAST_ANCHOR_STORAGE_KEY);
    return TOAST_ANCHORS.includes(saved as ToastAnchor)
      ? (saved as ToastAnchor)
      : DEFAULT_TOAST_ANCHOR;
  } catch {
    return DEFAULT_TOAST_ANCHOR;
  }
}

function loadToastDurationSeconds(): number {
  try {
    const saved = Number(
      localStorage.getItem(TOAST_DURATION_SECONDS_STORAGE_KEY),
    );
    return Number.isFinite(saved) && saved > 0
      ? saved
      : DEFAULT_TOAST_DURATION_SECONDS;
  } catch {
    return DEFAULT_TOAST_DURATION_SECONDS;
  }
}

function loadToastTypeFilters(): ToastTypeFilters {
  try {
    const raw = localStorage.getItem(TOAST_TYPE_FILTERS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_TOAST_TYPE_FILTERS };
    const saved = JSON.parse(raw) as Partial<ToastTypeFilters>;
    return Object.fromEntries(
      TOAST_TYPES.map((type) => [
        type,
        saved[type] ?? DEFAULT_TOAST_TYPE_FILTERS[type],
      ]),
    ) as ToastTypeFilters;
  } catch {
    return { ...DEFAULT_TOAST_TYPE_FILTERS };
  }
}

/**
 * Toast settings, shared module state: whether toasts appear at all, where
 * the stack is anchored, whether toasts auto-hide and after how long,
 * whether they carry a pin, and which message types get toasted.
 * Configured in SysCtl → Widgets.
 */
export const toastEnabled = ref<boolean>(
  loadBoolean(TOAST_ENABLED_STORAGE_KEY, DEFAULT_TOAST_ENABLED),
);
export const toastAnchor = ref<ToastAnchor>(loadToastAnchor());
export const toastAutoHide = ref<boolean>(
  loadBoolean(TOAST_AUTO_HIDE_STORAGE_KEY, DEFAULT_TOAST_AUTO_HIDE),
);
export const toastDurationSeconds = ref<number>(loadToastDurationSeconds());
export const toastPinEnabled = ref<boolean>(
  loadBoolean(TOAST_PIN_ENABLED_STORAGE_KEY, DEFAULT_TOAST_PIN_ENABLED),
);
export const toastTypeFilters = ref<ToastTypeFilters>(loadToastTypeFilters());

export function setToastEnabled(enabled: boolean) {
  toastEnabled.value = enabled;
  saveBoolean(TOAST_ENABLED_STORAGE_KEY, enabled);
}

export function setToastAnchor(anchor: ToastAnchor) {
  toastAnchor.value = anchor;
  try {
    localStorage.setItem(TOAST_ANCHOR_STORAGE_KEY, anchor);
  } catch {
    /* storage unavailable — the setting stays in-memory only */
  }
}

export function setToastAutoHide(enabled: boolean) {
  toastAutoHide.value = enabled;
  saveBoolean(TOAST_AUTO_HIDE_STORAGE_KEY, enabled);
}

export function setToastDurationSeconds(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return;
  toastDurationSeconds.value = seconds;
  try {
    localStorage.setItem(TOAST_DURATION_SECONDS_STORAGE_KEY, String(seconds));
  } catch {
    /* storage unavailable — the setting stays in-memory only */
  }
}

export function setToastPinEnabled(enabled: boolean) {
  toastPinEnabled.value = enabled;
  saveBoolean(TOAST_PIN_ENABLED_STORAGE_KEY, enabled);
}

export function setToastTypeFilter(type: ToastType, enabled: boolean) {
  toastTypeFilters.value = { ...toastTypeFilters.value, [type]: enabled };
  try {
    localStorage.setItem(
      TOAST_TYPE_FILTERS_STORAGE_KEY,
      JSON.stringify(toastTypeFilters.value),
    );
  } catch {
    /* storage unavailable — the setting stays in-memory only */
  }
}

/** Restore the toast settings to their defaults. */
export function resetToastSettings() {
  setToastEnabled(DEFAULT_TOAST_ENABLED);
  setToastAnchor(DEFAULT_TOAST_ANCHOR);
  setToastAutoHide(DEFAULT_TOAST_AUTO_HIDE);
  setToastDurationSeconds(DEFAULT_TOAST_DURATION_SECONDS);
  setToastPinEnabled(DEFAULT_TOAST_PIN_ENABLED);
  for (const type of TOAST_TYPES) {
    setToastTypeFilter(type, DEFAULT_TOAST_TYPE_FILTERS[type]);
  }
}
