import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { getApiUrl } from '@/api/api-url';
import { fetchConfig, saveConfig } from '@/api/config.api';
import { useConversationStore } from '@/stores/conversation';
import { getPersistentSocketSessionId } from '@/stores/helpers/get-persistent-socket-session-id.helper';
import { formatCtx } from '@/utils/format-ctx.helper';

import { useToast } from '../composables/use-toast';

const SESSION_ID = getPersistentSocketSessionId();

export interface OllamaModel {
  model: string;
  /** Where the model runs: the configured host or Ollama Cloud. */
  origin?: 'local' | 'cloud';
  parameter_size?: string;
  quantization_level?: string;
  family?: string;
  capabilities?: string[];
  context_length?: number;
}

export const useModelsStore = defineStore('models', () => {
  const models = ref<OllamaModel[]>([]);
  const numCtxOptions = ref<number[]>([]);
  const modelsLoading = ref(false);
  const toast = useToast();
  const selectedModel = ref('');

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

  async function fetchModels(isRefresh = false) {
    modelsLoading.value = true;
    try {
      const res = await fetch(getApiUrl('/api/v1/harness/models'));
      if (!res.ok) {
        toast.error(`Failed to load models: ${res.status}`);
        return;
      }
      const data = await res.json();
      models.value = (data.models ?? []) as OllamaModel[];
      numCtxOptions.value = data.numCtxOptions ?? [];
      await loadSelectedModel();
      syncSessionsToAvailableModels();
      if (isRefresh) {
        toast.success(`Loaded ${models.value.length} models`);
      }
    } catch (e) {
      console.error('Failed to fetch models:', e);
      toast.error('Failed to load models');
    } finally {
      modelsLoading.value = false;
    }
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
    getModel,
    formatCtx,
    maxNumCtxForModel,
    fetchModels,
  };
});
