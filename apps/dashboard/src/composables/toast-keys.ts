/**
 * Stable identities for mutable toast messages, passed as `ToastOptions.key`.
 * A toast carrying a key shows the "don't show this message again" action,
 * and muting silences every message that shares the key (across models,
 * sessions, and params) until it's un-muted in Settings → Widgets → Toast
 * notifications. Keys intentionally mirror the i18n message key.
 */
export const TOAST_KEY_MODEL_NO_IMAGES = 'toast.modelNoImages';
export const TOAST_KEY_MODEL_NO_THINK = 'toast.modelNoThink';
export const TOAST_KEY_CONTEXT_CLAMPED = 'toast.contextClamped';
export const TOAST_KEY_CONTEXT_FULL = 'toast.contextFull';
export const TOAST_KEY_SEARCH_ENGINES_REDUNDANT =
  'toast.serperBrightDataRedundant';
