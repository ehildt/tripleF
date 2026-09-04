import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

import { useModelsStore } from '@/stores/models';

import { useOllamaConnection } from './use-ollama-connection';

const settingsState = {
  updateApiKey: vi.fn(),
  patchConfig: vi.fn(),
  resetProvider: vi.fn(),
};

vi.mock('../../composables/use-settings-config', () => ({
  useSettingsConfig: () => ({
    config: ref({ ollama: { apiKey: 'abcd****wxyz', host: 'https://ollama' } }),
    isLoading: ref(false),
    hasError: ref(false),
    resetProvider: settingsState.resetProvider,
    patchConfig: settingsState.patchConfig,
    updateApiKey: settingsState.updateApiKey,
  }),
}));

describe('useOllamaConnection', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('syncs the drafts from the masked config', async () => {
    const { apiKeyDraft, hostDraft } = useOllamaConnection();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(apiKeyDraft.value).toBe('abcd****wxyz');
    expect(hostDraft.value).toBe('https://ollama');
  });

  it('saves the API key and refetches the models on success', async () => {
    settingsState.updateApiKey.mockResolvedValue(true);
    const modelsStore = useModelsStore();
    const fetchModels = vi
      .spyOn(modelsStore, 'fetchModels')
      .mockResolvedValue(undefined);

    const { apiKeyDraft, submitApiKey } = useOllamaConnection();
    apiKeyDraft.value = 'new-secret-key';
    await submitApiKey();

    expect(settingsState.updateApiKey).toHaveBeenCalledWith(
      'ollama',
      'new-secret-key',
    );
    expect(fetchModels).toHaveBeenCalledTimes(1);
  });

  it('does not refetch the models when the key save fails', async () => {
    settingsState.updateApiKey.mockResolvedValue(false);
    const modelsStore = useModelsStore();
    const fetchModels = vi
      .spyOn(modelsStore, 'fetchModels')
      .mockResolvedValue(undefined);

    const { apiKeyDraft, submitApiKey } = useOllamaConnection();
    apiKeyDraft.value = 'new-secret-key';
    await submitApiKey();

    expect(fetchModels).not.toHaveBeenCalled();
  });

  it('saves the host and refetches the models', async () => {
    const modelsStore = useModelsStore();
    const fetchModels = vi
      .spyOn(modelsStore, 'fetchModels')
      .mockResolvedValue(undefined);

    const { hostDraft, submitHost } = useOllamaConnection();
    hostDraft.value = 'https://ollama.com/api';
    await submitHost();

    expect(settingsState.patchConfig).toHaveBeenCalledWith(
      'ollama',
      'host',
      'https://ollama.com/api',
    );
    expect(fetchModels).toHaveBeenCalledTimes(1);
  });
});
