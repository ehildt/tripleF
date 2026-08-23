import { computed } from 'vue';

import { useModelsStore } from '@/stores/models';

import { useApiKeyForm } from '../../composables/use-api-key-form';
import { useHostForm } from '../../composables/use-host-form';
import { useSysctlConfig } from '../../composables/use-sysctl-config';

/**
 * Ollama connection state and writes for the System tab: the masked API key
 * and host forms (drafts, submit, select-on-focus) plus the models refetch
 * every connection change triggers — setting an API key also unlocks the
 * Ollama Cloud models, and a host change points the catalog elsewhere.
 */
export function useOllamaConnection() {
  const {
    config,
    isLoading,
    hasError,
    resetProvider,
    patchConfig,
    updateApiKey,
  } = useSysctlConfig();

  const modelsStore = useModelsStore();

  const maskedOllamaApiKey = computed(() => config.value?.ollama.apiKey ?? '');
  const ollamaHost = computed(() => config.value?.ollama.host ?? '');

  async function saveOllamaApiKey(apiKey: string) {
    const saved = await updateApiKey('ollama', apiKey);
    if (saved) await modelsStore.fetchModels();
    return saved;
  }

  async function saveOllamaHost(host: string) {
    await patchConfig('ollama', 'host', host);
    await modelsStore.fetchModels();
  }

  const {
    draft: apiKeyDraft,
    selectAllText: selectApiKeyText,
    submit: submitApiKey,
  } = useApiKeyForm(saveOllamaApiKey, maskedOllamaApiKey);

  const { draft: hostDraft, submit: submitHost } = useHostForm(
    saveOllamaHost,
    ollamaHost,
  );

  return {
    isLoading,
    hasError,
    resetProvider,
    apiKeyDraft,
    selectApiKeyText,
    submitApiKey,
    hostDraft,
    submitHost,
  };
}
