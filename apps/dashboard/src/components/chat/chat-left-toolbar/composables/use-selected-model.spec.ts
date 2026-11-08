import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useConversationStore } from '@/stores/chat/conversation/conversation.store';
import { createConversation } from '@/stores/chat/conversation/helpers/create-conversation.helper';
import { useModelsStore } from '@/stores/models/models.store';
import type { OllamaModel } from '@/types/ollama-model.model';

import { useSelectedModel } from './use-selected-model';

const warmModel = vi.hoisted(() => vi.fn());
const toast = vi.hoisted(() => ({ warning: vi.fn() }));
const configuration = vi.hoisted(() => ({
  setModel: vi.fn(),
  setNumCtx: vi.fn(),
}));

vi.mock('@/components/chat/composables/use-conversation-configuration', () => ({
  useConversationConfiguration: () => configuration,
}));

vi.mock('@/api/warm-model.api', () => ({ warmModel }));
vi.mock('@/composables/use-toast/use-toast', () => ({ useToast: () => toast }));
vi.mock('@/i18n/i18n', () => ({
  i18n: { global: { t: (key: string) => key } },
}));

function model(overrides: Partial<OllamaModel> = {}): OllamaModel {
  return {
    model: 'llama',
    origin: 'local',
    context_length: 8192,
    capabilities: ['text'],
    ...overrides,
  } as OllamaModel;
}

describe('useSelectedModel', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.restoreAllMocks();
    warmModel.mockClear();
    toast.warning.mockClear();
    configuration.setModel.mockClear();
    configuration.setNumCtx.mockClear();
  });

  it('falls back to the global selection when no conversation is active', () => {
    const modelsStore = useModelsStore();
    modelsStore.selectedModel = 'llama';

    const { selectedModelName } = useSelectedModel();
    expect(selectedModelName.value).toBe('llama');
  });

  it('prefers the active conversation model over the global selection', () => {
    const conversationStore = useConversationStore();
    const conversation = createConversation('New chat', {
      model: 'conv-model',
    });
    conversationStore.conversations = [conversation];
    conversationStore.activeConversationId = conversation.id;

    const modelsStore = useModelsStore();
    modelsStore.selectedModel = 'global-model';

    const { selectedModelName } = useSelectedModel();
    expect(selectedModelName.value).toBe('conv-model');
  });

  it('reports the selected model missing only when the catalog lacks it', () => {
    const modelsStore = useModelsStore();
    modelsStore.selectedModel = 'ghost';
    modelsStore.models = [model({ model: 'llama' })];

    const { isModelMissing } = useSelectedModel();
    expect(isModelMissing.value).toBe(true);
  });

  it('changeModel warms local models only', () => {
    const modelsStore = useModelsStore();
    modelsStore.warmModelOnSelect = true;
    modelsStore.models = [model({ origin: 'local' })];
    vi.spyOn(modelsStore, 'setSelectedModel').mockImplementation(() => {});

    const { changeModel } = useSelectedModel();
    changeModel('llama');

    expect(warmModel).toHaveBeenCalledWith('llama');
  });

  it('changeModel skips warming cloud models', () => {
    const modelsStore = useModelsStore();
    modelsStore.warmModelOnSelect = true;
    modelsStore.models = [model({ origin: 'cloud' })];
    vi.spyOn(modelsStore, 'setSelectedModel').mockImplementation(() => {});

    const { changeModel } = useSelectedModel();
    changeModel('llama');

    expect(warmModel).not.toHaveBeenCalled();
  });

  it('changeModel clamps an oversized numCtx and warns', () => {
    const conversationStore = useConversationStore();
    const conversation = createConversation('New chat', {
      model: 'llama',
      numCtx: '999999',
    });
    conversationStore.conversations = [conversation];
    conversationStore.activeConversationId = conversation.id;

    const modelsStore = useModelsStore();
    modelsStore.models = [model({ context_length: 8192 })];
    modelsStore.numCtxOptions = [2048, 4096, 8192];
    vi.spyOn(modelsStore, 'setSelectedModel').mockImplementation(() => {});
    const { changeModel } = useSelectedModel();
    changeModel('llama');

    expect(configuration.setNumCtx).toHaveBeenCalledWith(
      conversation.id,
      '8192',
    );
    expect(toast.warning).toHaveBeenCalled();
  });

  it('changeModel applies the max option without warning when within the window', () => {
    const conversationStore = useConversationStore();
    const conversation = createConversation('New chat', {
      model: 'llama',
      numCtx: '4096',
    });
    conversationStore.conversations = [conversation];
    conversationStore.activeConversationId = conversation.id;

    const modelsStore = useModelsStore();
    modelsStore.models = [model({ context_length: 8192 })];
    modelsStore.numCtxOptions = [2048, 4096, 8192];
    vi.spyOn(modelsStore, 'setSelectedModel').mockImplementation(() => {});
    const { changeModel } = useSelectedModel();
    changeModel('llama');

    expect(configuration.setNumCtx).toHaveBeenCalledWith(
      conversation.id,
      '8192',
    );
    expect(toast.warning).not.toHaveBeenCalled();
  });
});
