import { defineStore } from 'pinia';
import { reactive, watch } from 'vue';

import { i18n } from '@/i18n/i18n';
import type { ToastType } from '@/types/toast-type.model';

import type { Toast, ToastOptions, ToastTimer } from './toast.types';
import { useToastSettingsStore } from './toast-settings';

/**
 * The on-screen toast queue: pushes, timers, pinning, and "don't show again"
 * muting. Reads the toast settings store for the master toggle, anchor,
 * duration, type filters, and muted message kinds.
 */
export const useToastStore = defineStore('toast', () => {
  const toastSettingsStore = useToastSettingsStore();

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
    if (!toast || toast.pinned || !toastSettingsStore.toastAutoHide) return;
    startTimer(id);
  }

  function push(
    message: string,
    type: ToastType,
    options?: ToastOptions,
  ): void {
    const id = uid();
    toasts.push({ id, message, type, pinned: false, key: options?.key });
    timers.set(id, {
      timeoutId: null,
      remainingMs:
        options?.duration ?? toastSettingsStore.toastDurationSeconds * 1000,
      startedAt: 0,
    });
    if (toastSettingsStore.toastAutoHide) startTimer(id);
  }

  function add(message: string, type: ToastType, options?: ToastOptions): void {
    if (
      !toastSettingsStore.toastEnabled ||
      !toastSettingsStore.toastTypeFilters[type]
    ) {
      return;
    }
    if (options?.key && toastSettingsStore.isToastMessageMuted(options.key)) {
      return;
    }
    push(message, type, options);
  }

  /**
   * Example toast from Settings → Widgets: bypasses the master toggle and
   * type filters so the current anchor/duration/pin settings can be previewed.
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
  watch(
    () => toastSettingsStore.toastAutoHide,
    (autoHide) => {
      for (const toast of toasts) {
        if (autoHide) resume(toast.id);
        else pause(toast.id);
      }
    },
  );

  /**
   * "Don't show again": mute the toast's message kind for good, sweep any
   * visible copies, and confirm with a filter-bypassing info toast so the
   * user knows where to undo it (Settings → Widgets → Toast notifications).
   */
  function muteToast(id: string) {
    const toast = toasts.find((t) => t.id === id);
    const key = toast?.key;
    if (!toast || !key) return;
    toastSettingsStore.muteToastMessage(key, toast.message);
    for (const visible of toasts.filter((t) => t.key === key)) {
      remove(visible.id);
    }
    push(i18n.global.t('common.toastMutedConfirm'), 'info');
  }

  return { toasts, add, remove, pause, resume, togglePin, preview, muteToast };
});
