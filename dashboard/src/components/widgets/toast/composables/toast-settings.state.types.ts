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
