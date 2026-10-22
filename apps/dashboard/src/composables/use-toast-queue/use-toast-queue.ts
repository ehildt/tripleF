import { reactive, watch } from 'vue';

import { i18n } from '@/i18n/i18n';
import { useToastSettingsStore } from '@/stores/toast-settings/toast-settings.store';
import type { ToastType } from '@/types/toast-type.model';

import type { ToastOptions } from '../use-toast/use-toast.types';
import type { Toast, ToastTimer } from './use-toast-queue.types';

/**
 * The on-screen toast queue: pushes, timers, pinning, and "don't show again"
 * muting. Reads the toast settings store for the master toggle, anchor,
 * duration, type filters, and muted message kinds.
 *
 * Module-scope singleton (rule 20): one on-screen queue exists for the whole
 * app regardless of which caller asks, so the queue and its timers live at
 * module scope. The settings store resolves lazily per call — the module
 * imports in spec contexts before Pinia is active. The auto-hide watcher arms
 * on the first `useToastQueue()` call (app and specs both have an active
 * Pinia by then). The spec resets the queue between tests. This used to be a
 * Pinia store; it runs a timer engine over queue data, not data CRUD, so per
 * convention it is a composable.
 */
const toasts = reactive<Toast[]>([]);
const timers = new Map<string, ToastTimer>();
let autoHideWatcherArmed = false;

function uid(): string {
  return crypto.randomUUID().slice(0, 9);
}

export function useToastQueue() {
  if (!autoHideWatcherArmed) {
    autoHideWatcherArmed = true;
    // Toggling auto-hide applies to the toasts already on screen, not just
    // new ones.
    watch(
      () => useToastSettingsStore().toastAutoHide,
      (autoHide) => {
        for (const toast of toasts) {
          if (autoHide) resume(toast.id);
          else pause(toast.id);
        }
      },
    );
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
    if (!toast || toast.pinned || !useToastSettingsStore().toastAutoHide)
      return;
    startTimer(id);
  }

  function push(
    message: string,
    type: ToastType,
    options?: ToastOptions,
  ): void {
    const settings = useToastSettingsStore();
    const id = uid();
    toasts.push({ id, message, type, pinned: false, key: options?.key });
    timers.set(id, {
      timeoutId: null,
      remainingMs: options?.duration ?? settings.toastDurationSeconds * 1000,
      startedAt: 0,
    });
    if (settings.toastAutoHide) startTimer(id);
  }

  function add(message: string, type: ToastType, options?: ToastOptions): void {
    const settings = useToastSettingsStore();
    if (!settings.toastEnabled || !settings.toastTypeFilters[type]) {
      return;
    }
    if (options?.key && settings.isToastMessageMuted(options.key)) {
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

  /**
   * "Don't show again": mute the toast's message kind for good, sweep any
   * visible copies, and confirm with a filter-bypassing info toast so the
   * user knows where to undo it (Settings → Widgets → Toast notifications).
   */
  function muteToast(id: string) {
    const toast = toasts.find((t) => t.id === id);
    const key = toast?.key;
    if (!toast || !key) return;
    useToastSettingsStore().muteToastMessage(key, toast.message);
    for (const visible of toasts.filter((t) => t.key === key)) {
      remove(visible.id);
    }
    push(i18n.global.t('common.toastMutedConfirm'), 'info');
  }

  return { toasts, add, remove, pause, resume, togglePin, preview, muteToast };
}
