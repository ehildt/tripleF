import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import { TOAST_KEY_MODEL_NO_IMAGES } from '@/composables/toast-keys';
import { useConversationStore } from '@/stores/conversation';

import { useSelectedModel } from './use-selected-model';

const mockToast = vi.hoisted(() => ({
  warning: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
}));

vi.mock('../../../../../composables/use-toast', () => ({
  useToast: () => mockToast,
}));

const mockModelsStore = vi.hoisted(() => ({
  selectedModel: '',
  setSelectedModel: vi.fn(),
  modelsLoading: false,
  models: [] as Array<{ model: string }>,
  numCtxOptions: [2048, 4096],
  defaultNumCtx: '4096',
  formatCtx: (n: number) => String(n),
  maxNumCtxForModel: () => '4096',
  getModel: (name: string) => {
    if (name === 'vision-model') {
      return {
        model: 'vision-model',
        capabilities: ['completion', 'vision'],
        context_length: 4096,
      };
    }
    return {
      model: name,
      capabilities: ['completion'],
      context_length: 2048,
    };
  },
}));

vi.mock('../../../../../stores/models', () => ({
  useModelsStore: () => mockModelsStore,
}));

describe('useSelectedModel', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockModelsStore.selectedModel = '';
    mockModelsStore.setSelectedModel.mockClear();
    mockToast.warning.mockClear();
  });

  it('starts with empty selectedModel when the store has none', () => {
    const { selectedModel } = useSelectedModel();
    expect(selectedModel.value).toBe('');
  });

  it('initializes selectedModel from the models store', () => {
    mockModelsStore.selectedModel = 'llama3';
    const { selectedModel } = useSelectedModel();
    expect(selectedModel.value).toBe('llama3');
  });

  it('hasNoModelSelected is true when no model set', () => {
    const { hasNoModelSelected } = useSelectedModel();
    expect(hasNoModelSelected.value).toBe(true);
  });

  it('hasNoModelSelected is false when the store has a model', () => {
    mockModelsStore.selectedModel = 'llama3';
    const { hasNoModelSelected } = useSelectedModel();
    expect(hasNoModelSelected.value).toBe(false);
  });

  it('changeModel persists via the models store and the conversation store', () => {
    const conversationStore = useConversationStore();
    const conversation = conversationStore.ensureConversation();
    conversationStore.setActiveConversation(conversation.id);

    const { selectedModel, changeModel } = useSelectedModel();
    changeModel('mistral');

    expect(selectedModel.value).toBe('mistral');
    expect(mockModelsStore.setSelectedModel).toHaveBeenCalledWith('mistral');
    expect(conversation.model).toBe('mistral');
  });

  it('deselects meta images when switching to a non-vision model', () => {
    const conversationStore = useConversationStore();
    const conversation = conversationStore.ensureConversation();
    conversationStore.setActiveConversation(conversation.id);
    conversationStore.setUploadedImages(conversation.id, [
      { name: 'a.png', hash: 'h1', uploadedAt: 1 },
      { name: 'b.png', hash: 'h2', uploadedAt: 2 },
    ]);

    const { changeModel } = useSelectedModel();
    changeModel('text-model');

    expect(
      conversation.uploadedImages.every((img) => img.selected === false),
    ).toBe(true);
    expect(conversation.imageSelectionSnapshot).toEqual({
      h1: true,
      h2: true,
    });
  });

  it('restores previous selections when switching back to a vision model', () => {
    const conversationStore = useConversationStore();
    const conversation = conversationStore.ensureConversation();
    conversationStore.setActiveConversation(conversation.id);
    conversationStore.setUploadedImages(conversation.id, [
      { name: 'a.png', hash: 'h1', uploadedAt: 1 },
      { name: 'b.png', hash: 'h2', uploadedAt: 2, selected: false },
    ]);

    const { changeModel } = useSelectedModel();
    changeModel('text-model');
    changeModel('vision-model');

    expect(
      conversation.uploadedImages.find((img) => img.hash === 'h1')?.selected,
    ).toBe(true);
    expect(
      conversation.uploadedImages.find((img) => img.hash === 'h2')?.selected,
    ).toBe(false);
    expect(conversation.imageSelectionSnapshot).toEqual({});
  });

  it('keeps images deselected while repeatedly switching between non-vision models', () => {
    const conversationStore = useConversationStore();
    const conversation = conversationStore.ensureConversation();
    conversationStore.setActiveConversation(conversation.id);
    conversationStore.setUploadedImages(conversation.id, [
      { name: 'a.png', hash: 'h1', uploadedAt: 1 },
    ]);

    const { changeModel } = useSelectedModel();
    changeModel('text-model');
    // Toggle is disabled for non-vision, but simulate a user action that
    // somehow re-selected an image while still on a non-vision model.
    conversationStore.toggleUploadedImageSelected(conversation.id, 'h1');
    changeModel('other-text-model');

    expect(
      conversation.uploadedImages.find((img) => img.hash === 'h1')?.selected,
    ).toBe(false);
    expect(conversation.imageSelectionSnapshot).toEqual({ h1: true });
  });

  it('toasts the selected model name when the model is chosen before a conversation exists', async () => {
    const { changeModel } = useSelectedModel();
    changeModel('text-model'); // no active conversation yet

    const conversationStore = useConversationStore();
    const conversation = conversationStore.ensureConversation();

    await nextTick(); // flush the [conversationId, model] watcher

    // The fresh conversation has model '' — the toast must still name the
    // model whose capabilities triggered it.
    expect(conversation.model).toBe('');
    expect(mockToast.warning).toHaveBeenCalledWith(
      expect.stringContaining('text-model'),
      { key: TOAST_KEY_MODEL_NO_IMAGES },
    );
  });

  it('does not toast a blank model when switching back from a vision model', () => {
    const conversationStore = useConversationStore();
    const conversation = conversationStore.ensureConversation();
    conversationStore.setActiveConversation(conversation.id);
    conversationStore.setModel(conversation.id, 'vision-model');

    const { changeModel } = useSelectedModel();
    changeModel('text-model');

    expect(mockToast.warning).toHaveBeenCalledWith(
      expect.stringContaining('text-model'),
      { key: TOAST_KEY_MODEL_NO_IMAGES },
    );
  });

  it('backfills numCtx when active conversation has a model but no context size', () => {
    mockModelsStore.selectedModel = 'llama3';
    const conversationStore = useConversationStore();
    const conversation = conversationStore.ensureConversation();
    conversationStore.setActiveConversation(conversation.id);

    useSelectedModel();

    expect(conversation.numCtx).toBe('4096');
  });

  it('does not snapshot selections on initial load with a non-vision model', () => {
    const conversationStore = useConversationStore();
    const conversation = conversationStore.ensureConversation();
    conversationStore.setActiveConversation(conversation.id);
    conversationStore.setUploadedImages(conversation.id, [
      { name: 'a.png', hash: 'h1', uploadedAt: 1 },
    ]);

    useSelectedModel();

    expect(conversation.imageSelectionSnapshot).toEqual({});
    expect(
      conversation.uploadedImages.find((img) => img.hash === 'h1')?.selected,
    ).toBe(true);
  });
});
