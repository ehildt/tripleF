import type { ToastType } from './toast-state';
import { useToastState } from './toast-state';

export type { ToastType };

export interface ToastOptions {
  duration?: number;
}

export function useToast() {
  const { add } = useToastState();

  const show = (
    message: string,
    type: ToastType = 'default',
    options?: ToastOptions,
  ) => {
    add(message, type, options?.duration);
  };

  return {
    show,
    info: (message: string, options?: ToastOptions) =>
      show(message, 'info', options),
    success: (message: string, options?: ToastOptions) =>
      show(message, 'success', options),
    warning: (message: string, options?: ToastOptions) =>
      show(message, 'warning', options),
    error: (message: string, options?: ToastOptions) =>
      show(message, 'error', options),
    default: (message: string, options?: ToastOptions) =>
      show(message, 'default', options),
  };
}
