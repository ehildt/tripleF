import type { ToastType } from '@/types/toast-type.model';

import type { ToastAnchor, ToastTypeFilters } from './toast-settings.types';

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

export const TOAST_ENABLED_STORAGE_KEY = 'vision-toast-enabled';

export const TOAST_ANCHOR_STORAGE_KEY = 'vision-toast-anchor';

export const TOAST_AUTO_HIDE_STORAGE_KEY = 'vision-toast-auto-hide';

export const TOAST_DURATION_SECONDS_STORAGE_KEY =
  'vision-toast-duration-seconds';

export const TOAST_PIN_ENABLED_STORAGE_KEY = 'vision-toast-pin-enabled';

export const TOAST_TYPE_FILTERS_STORAGE_KEY = 'vision-toast-type-filters';

export const TOAST_MUTED_MESSAGES_STORAGE_KEY = 'vision-toast-muted';

export const TOAST_ANCHORS: readonly ToastAnchor[] = [
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

export const TOAST_TYPES: readonly ToastType[] = [
  'info',
  'success',
  'warning',
  'error',
  'debug',
  'default',
];
