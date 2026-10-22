import type { ToastType } from '@/types/toast-type.model';

import { useToastQueue } from '../use-toast-queue/use-toast-queue';
import type { ToastOptions } from './use-toast.types';

export function useToast() {
  const toastQueue = useToastQueue();

  const show = (
    message: string,
    type: ToastType = 'default',
    options?: ToastOptions,
  ) => {
    toastQueue.add(message, type, options);
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
    debug: (message: string, options?: ToastOptions) =>
      show(message, 'debug', options),
    default: (message: string, options?: ToastOptions) =>
      show(message, 'default', options),
  };
}
