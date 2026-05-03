import { reactive } from 'vue';

export type ToastType = 'info' | 'success' | 'warning' | 'error' | 'default';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

const toasts = reactive<Toast[]>([]);
const timers = new Map<string, ReturnType<typeof setTimeout>>();

function uid(): string {
  return crypto.randomUUID().slice(0, 9);
}

function remove(id: string) {
  const idx = toasts.findIndex((t) => t.id === id);
  if (idx !== -1) toasts.splice(idx, 1);
  const timer = timers.get(id);
  if (timer) {
    clearTimeout(timer);
    timers.delete(id);
  }
}

function add(message: string, type: ToastType, duration = 3000): void {
  const id = uid();
  toasts.push({ id, message, type });
  timers.set(
    id,
    setTimeout(() => remove(id), duration),
  );
}

export function useToastState() {
  return { toasts, add, remove };
}
