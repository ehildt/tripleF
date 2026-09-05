import type { ToastType } from '../types/toast-type.model';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  pinned: boolean;
  /** Stable identity of the message kind — enables "don't show again" muting. */
  key?: string;
}

export interface ToastOptions {
  /** Auto-hide duration override in milliseconds. */
  duration?: number;
  /** Message-kind identity (see toast-keys.ts); muted keys never toast. */
  key?: string;
}

export interface ToastTimer {
  timeoutId: ReturnType<typeof setTimeout> | null;
  remainingMs: number;
  startedAt: number;
}
