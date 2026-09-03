import type { ToastType } from '@/types/toast-type.model';

import { useToastState } from './toast-state';
import type { ToastOptions } from './use-toast.types';

export type { ToastType };

export function useToast() {
  const { add, preview } = useToastState();

  const show = (
    message: string,
    type: ToastType = 'default',
    options?: ToastOptions,
  ) => {
    add(message, type, options);
  };

  return {
    show,
    preview,
    info: (message: string, options?: ToastOptions) =>
      show(message, 'info', options),
    success: (message: string, options?: ToastOptions) =>
      show(message, 'success', options),
    warning: (message: string, options?: ToastOptions) =>
      show(message, 'warning', options),
    error: (message: string, options?: ToastOptions) =>
      show(message, 'error', options),
    debug: (message: string, options?: ToastOptions) =>
      show(message, 'debug', options),
    default: (message: string, options?: ToastOptions) =>
      show(message, 'default', options),
  };
}
