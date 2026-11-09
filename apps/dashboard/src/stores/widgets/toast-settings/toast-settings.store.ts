import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

import type { ToastType } from '@/types/toast-type.model';
import { loadBooleanSetting } from '@/utils/load-boolean-setting/load-boolean-setting.helper';
import { saveBooleanSetting } from '@/utils/save-boolean-setting/save-boolean-setting.helper';

import { appendMutedToastMessage } from './helpers/append-muted-toast-message.helper';
import { parseMutedToastMessages } from './helpers/parse-muted-toast-messages.helper';
import { parseToastAnchor } from './helpers/parse-toast-anchor.helper';
import { parseToastDurationSeconds } from './helpers/parse-toast-duration-seconds.helper';
import { parseToastTypeFilters } from './helpers/parse-toast-type-filters.helper';
import { removeMutedToastMessage } from './helpers/remove-muted-toast-message.helper';
import {
  DEFAULT_TOAST_ANCHOR,
  DEFAULT_TOAST_AUTO_HIDE,
  DEFAULT_TOAST_DURATION_SECONDS,
  DEFAULT_TOAST_ENABLED,
  DEFAULT_TOAST_PIN_ENABLED,
  DEFAULT_TOAST_TYPE_FILTERS,
  TOAST_ANCHOR_STORAGE_KEY,
  TOAST_AUTO_HIDE_STORAGE_KEY,
  TOAST_DURATION_SECONDS_STORAGE_KEY,
  TOAST_ENABLED_STORAGE_KEY,
  TOAST_MUTED_MESSAGES_STORAGE_KEY,
  TOAST_PIN_ENABLED_STORAGE_KEY,
  TOAST_TYPE_FILTERS_STORAGE_KEY,
} from './toast-settings.constant';
import type {
  MutedToastMessage,
  ToastAnchor,
  ToastTypeFilters,
} from './toast-settings.types';

/**
 * Toast settings: enablement, stack anchor, auto-hide duration, pin control,
 * type filters, and muted message kinds. The queue composable owns timers and
 * visible-toast lifecycle; this store owns only shared settings data/mutations.
 */
export const useToastSettingsStore = defineStore('toast-settings', () => {
  const toastEnabled = ref<boolean>(
    loadBooleanSetting(TOAST_ENABLED_STORAGE_KEY, DEFAULT_TOAST_ENABLED),
  );

  const toastAnchor = ref<ToastAnchor>(DEFAULT_TOAST_ANCHOR);
  try {
    toastAnchor.value = parseToastAnchor(
      localStorage.getItem(TOAST_ANCHOR_STORAGE_KEY),
    );
  } catch {
    /* Storage unavailable: retain the default anchor. */
  }

  const toastAutoHide = ref<boolean>(
    loadBooleanSetting(TOAST_AUTO_HIDE_STORAGE_KEY, DEFAULT_TOAST_AUTO_HIDE),
  );

  const toastDurationSeconds = ref<number>(DEFAULT_TOAST_DURATION_SECONDS);
  try {
    toastDurationSeconds.value = parseToastDurationSeconds(
      localStorage.getItem(TOAST_DURATION_SECONDS_STORAGE_KEY),
    );
  } catch {
    /* Storage unavailable: retain the default duration. */
  }

  const toastPinEnabled = ref<boolean>(
    loadBooleanSetting(
      TOAST_PIN_ENABLED_STORAGE_KEY,
      DEFAULT_TOAST_PIN_ENABLED,
    ),
  );

  const toastTypeFilters = ref<ToastTypeFilters>({
    ...DEFAULT_TOAST_TYPE_FILTERS,
  });

  try {
    toastTypeFilters.value = parseToastTypeFilters(
      localStorage.getItem(TOAST_TYPE_FILTERS_STORAGE_KEY),
    );
  } catch {
    /* Storage unavailable: retain the default filters. */
  }

  const toastMutedMessages = ref<MutedToastMessage[]>([]);
  try {
    toastMutedMessages.value = parseMutedToastMessages(
      localStorage.getItem(TOAST_MUTED_MESSAGES_STORAGE_KEY),
    );
  } catch {
    /* Storage unavailable: retain empty muted history. */
  }

  watch(
    toastTypeFilters,
    (filters) => {
      try {
        localStorage.setItem(
          TOAST_TYPE_FILTERS_STORAGE_KEY,
          JSON.stringify(filters),
        );
      } catch {
        /* Storage unavailable: retain the filters in memory. */
      }
    },
    { flush: 'sync' },
  );

  watch(
    toastMutedMessages,
    (messages) => {
      try {
        localStorage.setItem(
          TOAST_MUTED_MESSAGES_STORAGE_KEY,
          JSON.stringify(messages),
        );
      } catch {
        /* Storage unavailable: retain the muted history in memory. */
      }
    },
    { flush: 'sync' },
  );

  function setToastEnabled(enabled: boolean): void {
    toastEnabled.value = enabled;
    saveBooleanSetting(TOAST_ENABLED_STORAGE_KEY, enabled);
  }

  function setToastAnchor(anchor: ToastAnchor): void {
    toastAnchor.value = anchor;
    try {
      localStorage.setItem(TOAST_ANCHOR_STORAGE_KEY, anchor);
    } catch {
      /* Storage unavailable: retain the anchor in memory. */
    }
  }

  function setToastAutoHide(enabled: boolean): void {
    toastAutoHide.value = enabled;
    saveBooleanSetting(TOAST_AUTO_HIDE_STORAGE_KEY, enabled);
  }

  function setToastDurationSeconds(seconds: number): void {
    if (!Number.isFinite(seconds) || seconds <= 0) return;
    toastDurationSeconds.value = seconds;
    try {
      localStorage.setItem(TOAST_DURATION_SECONDS_STORAGE_KEY, String(seconds));
    } catch {
      /* Storage unavailable: retain the duration in memory. */
    }
  }

  function setToastPinEnabled(enabled: boolean): void {
    toastPinEnabled.value = enabled;
    saveBooleanSetting(TOAST_PIN_ENABLED_STORAGE_KEY, enabled);
  }

  function setToastTypeFilter(type: ToastType, enabled: boolean): void {
    toastTypeFilters.value = { ...toastTypeFilters.value, [type]: enabled };
  }

  /** Restore every preference, writing each persisted concern exactly once. */
  function resetToastSettings(): void {
    setToastEnabled(DEFAULT_TOAST_ENABLED);
    setToastAnchor(DEFAULT_TOAST_ANCHOR);
    setToastAutoHide(DEFAULT_TOAST_AUTO_HIDE);
    setToastDurationSeconds(DEFAULT_TOAST_DURATION_SECONDS);
    setToastPinEnabled(DEFAULT_TOAST_PIN_ENABLED);
    toastTypeFilters.value = { ...DEFAULT_TOAST_TYPE_FILTERS };
    toastMutedMessages.value = [];
  }

  /** Muted message kinds are skipped when the queue receives a keyed toast. */
  function isToastMessageMuted(key: string): boolean {
    return toastMutedMessages.value.some((muted) => muted.key === key);
  }

  function muteToastMessage(key: string, sample: string): void {
    toastMutedMessages.value = appendMutedToastMessage(
      toastMutedMessages.value,
      key,
      sample,
    );
  }

  function unmuteToastMessage(key: string): void {
    toastMutedMessages.value = removeMutedToastMessage(
      toastMutedMessages.value,
      key,
    );
  }

  return {
    toastEnabled,
    toastAnchor,
    toastAutoHide,
    toastDurationSeconds,
    toastPinEnabled,
    toastTypeFilters,
    toastMutedMessages,
    setToastEnabled,
    setToastAnchor,
    setToastAutoHide,
    setToastDurationSeconds,
    setToastPinEnabled,
    setToastTypeFilter,
    resetToastSettings,
    isToastMessageMuted,
    muteToastMessage,
    unmuteToastMessage,
  };
});
