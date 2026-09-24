import type { ToastType } from '@/types/toast-type.model';

export type ToastAnchor =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'middle-left'
  | 'middle-center'
  | 'middle-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export type ToastTypeFilters = Record<ToastType, boolean>;

/** A message kind the user muted ("don't show again") from a toast. */
export interface MutedToastMessage {
  /** Stable message-kind identity (see composables/toast-keys.ts). */
  key: string;
  /** Message text at mute time, so the settings list stays human-readable. */
  sample: string;
}
