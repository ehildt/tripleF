import { reactive, watch } from 'vue';

import {
  toastAutoHide,
  toastDurationSeconds,
  toastEnabled,
  toastTypeFilters,
} from '../components/widgets/toast/composables/toast-settings.state';
import type { ToastType } from '../types/toast-type.model';
import type { Toast, ToastTimer } from './toast-state.types';

export type { ToastType };

const toasts = reactive<Toast[]>([]);
const timers = new Map<string, ToastTimer>();

function uid(): string {
  return crypto.randomUUID().slice(0, 9);
}

function remove(id: string) {
  const idx = toasts.findIndex((t) => t.id === id);
  if (idx !== -1) toasts.splice(idx, 1);
  const timer = timers.get(id);
  if (timer?.timeoutId) clearTimeout(timer.timeoutId);
  timers.delete(id);
}

function startTimer(id: string) {
  const timer = timers.get(id);
  if (!timer || timer.timeoutId || timer.remainingMs <= 0) return;
  timer.startedAt = Date.now();
  timer.timeoutId = setTimeout(() => remove(id), timer.remainingMs);
}

/**
 * Freeze the countdown (mouseenter): the elapsed slice is subtracted so
 * resume() continues where the user left off instead of restarting.
 */
function pause(id: string) {
  const timer = timers.get(id);
  if (!timer?.timeoutId) return;
  clearTimeout(timer.timeoutId);
  timer.timeoutId = null;
  timer.remainingMs -= Date.now() - timer.startedAt;
}

/** Continue the countdown (mouseleave, unpin) unless the toast is pinned. */
function resume(id: string) {
  const toast = toasts.find((t) => t.id === id);
  if (!toast || toast.pinned || !toastAutoHide.value) return;
  startTimer(id);
}

function push(message: string, type: ToastType, durationMs?: number): void {
  const id = uid();
  toasts.push({ id, message, type, pinned: false });
  timers.set(id, {
    timeoutId: null,
    remainingMs: durationMs ?? toastDurationSeconds.value * 1000,
    startedAt: 0,
  });
  if (toastAutoHide.value) startTimer(id);
}

function add(message: string, type: ToastType, durationMs?: number): void {
  if (!toastEnabled.value || !toastTypeFilters.value[type]) return;
  push(message, type, durationMs);
}

/**
 * Example toast from SysCtl → Widgets: bypasses the master toggle and type
 * filters so the current anchor/duration/pin settings can be previewed.
 */
function preview(message: string): void {
  push(message, 'info');
}

/** Pinning keeps a toast on screen; unpinning resumes its countdown. */
function togglePin(id: string) {
  const toast = toasts.find((t) => t.id === id);
  if (!toast) return;
  toast.pinned = !toast.pinned;
  if (toast.pinned) pause(id);
  else resume(id);
}

// Toggling auto-hide applies to the toasts already on screen, not just new ones.
watch(toastAutoHide, (autoHide) => {
  for (const toast of toasts) {
    if (autoHide) resume(toast.id);
    else pause(toast.id);
  }
});

export function useToastState() {
  return { toasts, add, remove, pause, resume, togglePin, preview };
}
