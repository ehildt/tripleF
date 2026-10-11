import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type Ref } from 'vue';

import { useConversationStore } from '@/stores/conversation';
import { useModelsStore } from '@/stores/models';
import type { OllamaModel } from '@/types/ollama-model.model';

import { useContextSize } from './use-context-size';

const selectedModel = vi.hoisted(() => ({})) as {
  details: Ref<OllamaModel | null>;
};

vi.mock('./use-selected-model', async () => {
  const { ref } = await import('vue');
  const details = ref<OllamaModel | null>(null);
  selectedModel.details = details;
  return { useSelectedModel: () => ({ selectedModelDetails: details }) };
});

describe('useContextSize', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    selectedModel.details.value = null;
  });

  it('clamps the options to the model context length', () => {
    const modelsStore = useModelsStore();
    modelsStore.numCtxOptions = [2048, 4096, 8192, 16384];
    selectedModel.details.value = { context_length: 8192 } as OllamaModel;

    const { contextOptions } = useContextSize();
    expect(contextOptions.value).toEqual(['2048', '4096', '8192']);
  });

  it('returns all options when the model has no context length', () => {
    const modelsStore = useModelsStore();
    modelsStore.numCtxOptions = [2048, 4096];
    selectedModel.details.value = null;

    const { contextOptions } = useContextSize();
    expect(contextOptions.value).toEqual(['2048', '4096']);
  });

  it('selectNumCtx clamps to the model max before persisting', () => {
    const modelsStore = useModelsStore();
    modelsStore.numCtxOptions = [2048, 4096, 8192];
    selectedModel.details.value = { context_length: 8192 } as OllamaModel;

    const conversationStore = useConversationStore();
    const conversation = conversationStore.ensureConversation();
    const setNumCtx = vi
      .spyOn(conversationStore, 'setNumCtx')
      .mockImplementation(() => {});

    const { selectNumCtx } = useContextSize();
    selectNumCtx('16384');

    expect(setNumCtx).toHaveBeenCalledWith(conversation.id, '8192');
  });

  it('selectNumCtx ensures a conversation when none is active', () => {
    const conversationStore = useConversationStore();
    const setNumCtx = vi
      .spyOn(conversationStore, 'setNumCtx')
      .mockImplementation(() => {});
    selectedModel.details.value = null;

    const { selectNumCtx } = useContextSize();
    selectNumCtx('4096');

    expect(setNumCtx).toHaveBeenCalled();
  });
});
