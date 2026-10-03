import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { useConversationStore } from '@/stores/conversation';
import { createConversation } from '@/stores/helpers/conversation/create-conversation.helper';
import { useModelsStore } from '@/stores/models';
import type { OllamaModel } from '@/types/ollama-model.model';

import { useChatModelSync } from './use-chat-model-sync';

function visionModel(): OllamaModel {
  return { model: 'llama-vision', capabilities: ['vision'] } as OllamaModel;
}

function textModel(): OllamaModel {
  return { model: 'llama-text', capabilities: ['text'] } as OllamaModel;
}

describe('useChatModelSync', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('reports no model selected when neither the conversation nor the store has one', () => {
    const { hasNoModelSelected } = useChatModelSync();
    expect(hasNoModelSelected.value).toBe(true);
  });

  it('prefers the active conversation model over the global selection', () => {
    const conversationStore = useConversationStore();
    const conversation = createConversation({ model: 'llama-text' });
    conversationStore.conversations = [conversation];
    conversationStore.activeConversationId = conversation.id;

    const modelsStore = useModelsStore();
    modelsStore.selectedModel = 'llama-vision';

    const { hasNoModelSelected } = useChatModelSync();
    expect(hasNoModelSelected.value).toBe(false);
  });

  it('treats an unloaded model catalog as vision-capable until details load', () => {
    const conversationStore = useConversationStore();
    const conversation = createConversation({ model: 'llama-text' });
    conversationStore.conversations = [conversation];
    conversationStore.activeConversationId = conversation.id;

    const { supportsVision } = useChatModelSync();
    expect(supportsVision.value).toBe(true);
  });

  it('reports vision support from the selected model capabilities', () => {
    const conversationStore = useConversationStore();
    const conversation = createConversation({ model: 'llama-vision' });
    conversationStore.conversations = [conversation];
    conversationStore.activeConversationId = conversation.id;

    const modelsStore = useModelsStore();
    modelsStore.models = [visionModel(), textModel()];
    modelsStore.selectedModel = 'llama-vision';

    const { supportsVision } = useChatModelSync();
    expect(supportsVision.value).toBe(true);
  });

  it('reports no vision support for a text-only model', () => {
    const conversationStore = useConversationStore();
    const conversation = createConversation({ model: 'llama-text' });
    conversationStore.conversations = [conversation];
    conversationStore.activeConversationId = conversation.id;

    const modelsStore = useModelsStore();
    modelsStore.models = [visionModel(), textModel()];
    modelsStore.selectedModel = 'llama-text';

    const { supportsVision } = useChatModelSync();
    expect(supportsVision.value).toBe(false);
  });

  it('inherits numCtx on a fresh conversation from its model', () => {
    const conversationStore = useConversationStore();
    const conversation = createConversation({
      model: 'llama-text',
      numCtx: '',
    });
    conversationStore.conversations = [conversation];
    conversationStore.activeConversationId = conversation.id;

    const modelsStore = useModelsStore();
    modelsStore.models = [{ ...textModel(), context_length: 8192 }];
    modelsStore.numCtxOptions = [2048, 4096, 8192];
    modelsStore.selectedModel = 'llama-text';

    useChatModelSync();

    expect(conversation.numCtx).toBe('8192');
  });
});
