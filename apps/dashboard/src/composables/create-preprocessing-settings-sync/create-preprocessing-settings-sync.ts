import { useDebounceFn } from '@vueuse/core';
import { watch } from 'vue';

import { fetchConfig, saveConfig } from '@/api/config.api';
import { fetchSharpOverrides } from '@/api/fetch-sharp-overrides.api';
import { saveSharpOverrides } from '@/api/save-sharp-overrides.api';
import { clonePreprocessingSettings } from '@/stores/preprocessing-settings/helpers/clone-preprocessing-settings.helper';
import type { usePreprocessingSettingsStore } from '@/stores/preprocessing-settings/preprocessing-settings.store';
import type { PreprocessingSettings } from '@/types/preprocessing.model';

import { resolvePreprocessingSettings } from './helpers/resolve-preprocessing-settings.helper';
import {
  PREPROCESSING_SAVE_DEBOUNCE_MS,
  PREPROCESSING_SAVE_MAX_WAIT_MS,
} from './create-preprocessing-settings-sync.constant';
import type { PreprocessingSettingsSync } from './create-preprocessing-settings-sync.types';

/** Create the preprocessing load/save workflow around one store and browser session. */
export function createPreprocessingSettingsSync(
  store: ReturnType<typeof usePreprocessingSettingsStore>,
  sessionId: string,
): PreprocessingSettingsSync {
  let isLoadingSettings = true;
  let loadPromise: Promise<void> | null = null;
  let pendingSnapshot: PreprocessingSettings | null = null;
  let saveQueue: Promise<void> = Promise.resolve();
  let latestSavePromise: Promise<void> = Promise.resolve();

  async function persistSettings(
    snapshot: PreprocessingSettings,
  ): Promise<void> {
    const [globalResult, sessionResult] = await Promise.allSettled([
      saveSharpOverrides(snapshot),
      saveConfig(sessionId, { preprocessing: snapshot }),
    ]);
    if (sessionResult.status === 'rejected') {
      console.error(
        'Failed to save session preprocessing settings',
        sessionResult.reason,
      );
    }
    // The global override controls preview processing. Session persistence is
    // best-effort and must not make a successfully applied preview unavailable.
    if (globalResult.status === 'rejected') throw globalResult.reason;
  }

  function enqueueSave(snapshot: PreprocessingSettings): void {
    const request = saveQueue.then(() => persistSettings(snapshot));
    latestSavePromise = request;
    // Keep the ordered queue usable after failure while retaining the original
    // rejection for an explicit preview flush to observe.
    saveQueue = request.catch((error: unknown) => {
      console.error('Preprocessing settings sync failed', error);
    });
  }

  function savePendingSettings(): void {
    if (!pendingSnapshot) return;
    const snapshot = pendingSnapshot;
    pendingSnapshot = null;
    enqueueSave(snapshot);
  }

  const debouncedSave = useDebounceFn(
    savePendingSettings,
    PREPROCESSING_SAVE_DEBOUNCE_MS,
    { maxWait: PREPROCESSING_SAVE_MAX_WAIT_MS },
  );

  watch(
    () => store.settings,
    () => {
      if (isLoadingSettings) return;
      pendingSnapshot = clonePreprocessingSettings(store.settings);
      void debouncedSave();
    },
    // Synchronous delivery makes hydration suppression deterministic: applying
    // server state cannot queue a callback that runs after loading has ended.
    { deep: true, flush: 'sync' },
  );

  async function performLoad(): Promise<void> {
    try {
      const [globalResult, sessionResult] = await Promise.allSettled([
        fetchSharpOverrides(),
        fetchConfig(sessionId),
      ]);
      if (globalResult.status === 'rejected') {
        console.error(
          'Failed to load global preprocessing settings',
          globalResult.reason,
        );
      }
      if (sessionResult.status === 'rejected') {
        console.error(
          'Failed to load session preprocessing settings',
          sessionResult.reason,
        );
      }
      const globalSettings =
        globalResult.status === 'fulfilled' ? globalResult.value : null;
      const sessionSettings =
        sessionResult.status === 'fulfilled'
          ? sessionResult.value?.preprocessing
          : null;
      store.applySettings(
        resolvePreprocessingSettings(globalSettings, sessionSettings),
      );
    } catch (error: unknown) {
      console.error('Preprocessing settings load failed', error);
    } finally {
      isLoadingSettings = false;
    }
  }

  function loadSettings(): Promise<void> {
    loadPromise ??= performLoad();
    return loadPromise;
  }

  async function flushSettings(): Promise<void> {
    await loadSettings();
    if (debouncedSave.isPending.value) {
      // VueUse executes the latest pending callback synchronously but does not
      // return its promise; latestSavePromise is the explicit awaitable bridge.
      debouncedSave.flush();
    } else {
      // Preview historically saves on every invocation, even without a new edit.
      enqueueSave(clonePreprocessingSettings(store.settings));
    }
    await latestSavePromise;
  }

  return { loadSettings, flushSettings };
}
