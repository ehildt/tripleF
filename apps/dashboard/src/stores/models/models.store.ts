import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import type { ModelsCatalog } from '@/types/models-catalog.model';
import type { OllamaModel } from '@/types/ollama-model.model';

import { selectPickerModels } from './helpers/select-picker-models.helper';

/** Shared model catalog data and synchronous derived state. */
export const useModelsStore = defineStore('models', () => {
  const models = ref<OllamaModel[]>([]);
  const numCtxOptions = ref<number[]>([]);
  const modelsLoading = ref(false);
  const selectedModel = ref('');
  const lastFetchOk = ref(false);

  function applyModelsCatalog(catalog: ModelsCatalog): void {
    models.value = catalog.models;
    numCtxOptions.value = catalog.numCtxOptions;
  }

  function setSelectedModel(modelName: string): void {
    selectedModel.value = modelName;
  }

  function setModelsLoading(loading: boolean): void {
    modelsLoading.value = loading;
  }

  function setLastFetchOk(succeeded: boolean): void {
    lastFetchOk.value = succeeded;
  }

  const defaultNumCtx = computed(() => {
    const option = numCtxOptions.value.at(-1);
    return option === undefined ? '' : String(option);
  });

  const modelNames = computed(() => models.value.map((model) => model.model));

  // Keep the raw catalog complete for availability checks, but expose only
  // models with reported capabilities in chat picker/fallback surfaces.
  const localModels = computed(() => selectPickerModels(models.value, 'local'));
  const cloudModels = computed(() => selectPickerModels(models.value, 'cloud'));

  function getModel(name: string): OllamaModel | undefined {
    return models.value.find((model) => model.model === name);
  }

  function maxNumCtxForModel(modelName: string): string {
    const contextLength = getModel(modelName)?.context_length;
    if (!contextLength) return '';
    const option = numCtxOptions.value
      .filter((candidate) => candidate <= contextLength)
      .at(-1);
    return String(option ?? contextLength);
  }

  const defaultModel = computed(() => {
    const eligibleModels = [...localModels.value, ...cloudModels.value];
    if (
      selectedModel.value &&
      eligibleModels.some((model) => model.model === selectedModel.value)
    )
      return selectedModel.value;

    return eligibleModels[0]?.model ?? '';
  });

  /** A successful empty response is ready; submit still requires a model. */
  const modelsReady = computed(
    () => models.value.length > 0 || lastFetchOk.value,
  );

  return {
    models,
    numCtxOptions,
    modelsLoading,
    selectedModel,
    lastFetchOk,
    applyModelsCatalog,
    setSelectedModel,
    setModelsLoading,
    setLastFetchOk,
    modelNames,
    localModels,
    cloudModels,
    defaultNumCtx,
    defaultModel,
    modelsReady,
    getModel,
    maxNumCtxForModel,
  };
});
