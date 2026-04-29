import { defineStore } from 'pinia';
import { ref } from 'vue';

import { getApiUrl } from '@/api/api-url';

import { useToast } from '../composables/use-toast';

export const useModelsStore = defineStore('models', () => {
  const models = ref<string[]>([]);
  const modelsLoading = ref(false);
  const toast = useToast();

  async function fetchModels(isRefresh = false) {
    modelsLoading.value = true;
    try {
      const res = await fetch(getApiUrl('/api/v1/vision/models'));
      if (res.ok) {
        const data = await res.json();
        models.value =
          data.models
            ?.map((m: { model: string }) => m.model)
            .sort((a: string, b: string) =>
              a.localeCompare(b, undefined, { sensitivity: 'base' }),
            ) ?? [];
        if (isRefresh) {
          toast.success(`Loaded ${models.value.length} models`);
        }
      } else {
        toast.error(`Failed to load models: ${res.status}`);
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
    modelsLoading,
    fetchModels,
  };
});
