import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { getApiUrl } from '@/api/api-url';
import { useConversationStore } from '@/stores/conversation';
import { formatCtx } from '@/utils/format-ctx.helper';

import { useToast } from '../composables/use-toast';

export interface OllamaModel {
  model: string;
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

  const defaultNumCtx = computed(() =>
    numCtxOptions.value.length > 0 ? String(numCtxOptions.value.at(-1)!) : '',
  );

  const modelNames = computed(() => models.value.map((m) => m.model));

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
    const saved = localStorage.getItem('harness-selected-model');
    if (saved && models.value.some((m) => m.model === saved)) {
      return saved;
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
    models,
    modelNames,
    numCtxOptions,
    defaultNumCtx,
    modelsLoading,
    getModel,
    formatCtx,
    maxNumCtxForModel,
    fetchModels,
  };
});
