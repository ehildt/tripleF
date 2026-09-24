import { useToastStore } from '@/stores/toast';
import type { ToastType } from '@/types/toast-type.model';

import type { ToastOptions } from './use-toast.types';

export type { ToastType };

export function useToast() {
  const toastStore = useToastStore();

  const show = (
    message: string,
    type: ToastType = 'default',
    options?: ToastOptions,
  ) => {
    toastStore.add(message, type, options);
  };

  return {
    show,
    preview: toastStore.preview,
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
