import type { Toast } from '@/composables/use-toast-queue/use-toast-queue.types';

export interface ToastItemProps {
  /** The toast to render (message, type, pinned flag, mute key). */
  toast: Toast;
  /** Show the pin button (Settings → Widgets → Toast notifications). */
  pinEnabled: boolean;
}

export interface ToastItemEmits {
  /** Dismiss the toast (its close button). */
  remove: [];
  /** Freeze the auto-hide countdown (mouse entered the toast). */
  pause: [];
  /** Continue the auto-hide countdown (mouse left the toast). */
  resume: [];
  /** Toggle the pinned state (the pin button — pinning freezes the timer). */
  togglePin: [];
  /** "Don't show again" — mute this toast's message kind permanently. */
  mute: [];
}
