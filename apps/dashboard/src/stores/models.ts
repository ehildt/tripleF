import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { getApiUrl } from '@/api/api-url';
import { fetchConfig, saveConfig } from '@/api/config.api';
import { i18n } from '@/i18n/i18n';
import { useConversationStore } from '@/stores/conversation';
import { getPersistentSocketSessionId } from '@/stores/helpers/socket/get-persistent-socket-session-id.helper';
import { formatCtx } from '@/utils/format-ctx.helper';

import { useToast } from '../composables/use-toast';
import type { OllamaModel } from '../types/ollama-model.model';

const SESSION_ID = getPersistentSocketSessionId();

/** localStorage key holding the last catalog ETag so reloads also get 304s. */
const ETAG_KEY = 'harness-models-etag';

function loadLastEtag(): string {
  try {
    return localStorage.getItem(ETAG_KEY) ?? '';
  } catch {
    return '';
  }
}

function saveLastEtag(etag: string) {
  try {
    localStorage.setItem(ETAG_KEY, etag);
  } catch {
    /* ignore */
  }
}

export const useModelsStore = defineStore('models', () => {
  const models = ref<OllamaModel[]>([]);
  const numCtxOptions = ref<number[]>([]);
  const modelsLoading = ref(false);
  const toast = useToast();
  const selectedModel = ref('');
  /** Whether the last catalog fetch succeeded (models may legitimately be empty). */
  const lastFetchOk = ref(false);
  /** Last catalog ETag (persisted) so conditional requests can 304. */
  const lastEtag = ref(loadLastEtag());
  /** In-flight fetch promise so concurrent callers share a single request. */
  let inFlight: Promise<void> | null = null;

  async function loadSelectedModel() {
    try {
      const config = await fetchConfig(SESSION_ID);
      if (config?.selectedModel) {
        selectedModel.value = config.selectedModel;
      }
    } catch {
      // Offline — fall back to the first available model later.
    }
  }

  function setSelectedModel(modelName: string) {
    selectedModel.value = modelName;
    saveConfig(SESSION_ID, { selectedModel: modelName }).catch(() => {
      // Offline — keep the in-memory value.
    });
  }

  const defaultNumCtx = computed(() =>
    numCtxOptions.value.length > 0 ? String(numCtxOptions.value.at(-1)!) : '',
  );

  const modelNames = computed(() => models.value.map((m) => m.model));

  // Sorted alphabetically within each section so the model selector's
  // local/cloud groups read in a stable order regardless of API order.
  const localModels = computed(() =>
    models.value
      .filter((m) => m.origin !== 'cloud')
      .sort((a, b) =>
        a.model.localeCompare(b.model, undefined, { sensitivity: 'base' }),
      ),
  );
  const cloudModels = computed(() =>
    models.value
      .filter((m) => m.origin === 'cloud')
      .sort((a, b) =>
        a.model.localeCompare(b.model, undefined, { sensitivity: 'base' }),
      ),
  );

  function maxNumCtxForModel(modelName: string): string {
    const model = getModel(modelName);
    if (!model?.context_length) return '';
    return String(
      numCtxOptions.value
        .filter((opt) => opt <= model.context_length!)
        .at(-1) ?? model.context_length,
    );
  }

  function getModel(name: string): OllamaModel | undefined {
    return models.value.find((m) => m.model === name);
  }

  const defaultModel = computed(() => {
    if (
      selectedModel.value &&
      models.value.some((m) => m.model === selectedModel.value)
    ) {
      return selectedModel.value;
    }
    return models.value[0]?.model ?? '';
  });

  /** True when the catalog is usable: loaded, or a fetch already succeeded. */
  const modelsReady = computed(
    () => models.value.length > 0 || lastFetchOk.value,
  );

  function syncSessionsToAvailableModels() {
    const fallbackModel = defaultModel.value;
    if (!fallbackModel) return;

    const conversationStore = useConversationStore();
    for (const s of conversationStore.conversations) {
      // If the conversation has no model or the model no longer exists,
      // adopt the globally resolved default model.
      const hasModel = models.value.some((m) => m.model === s.model);
      if (!hasModel) {
        s.model = fallbackModel;
      }

      // Always derive numCtx from the *conversation's* model context_length,
      // never from a static global default.
      const maxCtx = maxNumCtxForModel(s.model);
      if (maxCtx) {
        s.numCtx = maxCtx;
      }
    }
  }

  /**
   * Fetch the models catalog. Freshness is owned by the server cache
   * (OllamaModelsService), so every call here is cheap when the server has a
   * warm entry — there is no client-side TTL gate.
   *
   * - `refresh: true` shows a success toast (user-initiated refresh).
   * - `silent: true` skips the loading state and failure toasts (ambient
   *   triggers like prompt focus must never flash the selector or spam
   *   errors while the server is down).
   */
  async function fetchModels(options?: {
    refresh?: boolean;
    silent?: boolean;
  }) {
    if (inFlight) return inFlight;
    const { refresh = false, silent = false } = options ?? {};
    if (!silent) modelsLoading.value = true;
    inFlight = (async () => {
      try {
        const res = await fetch(getApiUrl('/api/v1/harness/models'), {
          headers: lastEtag.value
            ? { 'If-None-Match': lastEtag.value }
            : undefined,
        });
        if (res.status === 304) {
          // Catalog unchanged: keep the in-memory models, refresh the ETag
          // if the server echoed it, and never toast or flash.
          const etag = res.headers.get('ETag');
          if (etag) {
            lastEtag.value = etag;
            saveLastEtag(etag);
          }
          lastFetchOk.value = true;
          return;
        }
        if (!res.ok) {
          if (silent) {
            console.warn(`Failed to fetch models: ${res.status}`);
          } else {
            toast.error(
              i18n.global.t('toast.failedLoadModelsStatus', {
                status: res.status,
              }),
            );
          }
          lastFetchOk.value = false;
          return;
        }
        const data = await res.json();
        models.value = (data.models ?? []) as OllamaModel[];
        numCtxOptions.value = data.numCtxOptions ?? [];
        await loadSelectedModel();
        syncSessionsToAvailableModels();
        lastFetchOk.value = true;
        const etag = res.headers.get('ETag');
        if (etag) {
          lastEtag.value = etag;
          saveLastEtag(etag);
        }
        if (refresh) {
          toast.success(
            i18n.global.t('toast.loadedModels', { count: models.value.length }),
          );
        }
      } catch (e) {
        console.error('Failed to fetch models:', e);
        if (!silent) toast.error(i18n.global.t('toast.failedLoadModels'));
        lastFetchOk.value = false;
      } finally {
        if (!silent) modelsLoading.value = false;
        inFlight = null;
      }
    })();
    return inFlight;
  }

  /**
   * Resolve once the models catalog is usable: returns immediately when a
   * fetch already succeeded, otherwise awaits the in-flight fetch or starts
   * a fresh one. The submit flow uses this so a prompt sent right after
   * reload waits for the catalog instead of hard-failing with
   * "model required".
   */
  async function whenModelsReady(): Promise<void> {
    if (modelsReady.value) return;
    if (inFlight) return inFlight;
    await fetchModels();
  }

  return {
    selectedModel,
    setSelectedModel,
    models,
    modelNames,
    localModels,
    cloudModels,
    numCtxOptions,
    defaultNumCtx,
    modelsLoading,
    modelsReady,
    getModel,
    formatCtx,
    maxNumCtxForModel,
    fetchModels,
    whenModelsReady,
  };
});
