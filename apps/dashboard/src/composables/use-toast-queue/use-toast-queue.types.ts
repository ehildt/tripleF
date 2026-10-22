import type { ToastType } from '@/types/toast-type.model';

import type { ToastOptions } from '../use-toast/use-toast.types';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  pinned: boolean;
  /** Stable identity of the message kind — enables "don't show again" muting. */
  key?: string;
}

export interface ToastTimer {
  timeoutId: ReturnType<typeof setTimeout> | null;
  remainingMs: number;
  startedAt: number;
}

export type { ToastOptions };
