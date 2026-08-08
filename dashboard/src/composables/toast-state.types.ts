import type { ToastType } from '../types/toast-type.model';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  pinned: boolean;
}

export interface ToastTimer {
  timeoutId: ReturnType<typeof setTimeout> | null;
  remainingMs: number;
  startedAt: number;
}
