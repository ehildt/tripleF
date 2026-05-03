import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useConversationStore } from '@/stores/conversation';

import { useSelectedModel } from './use-selected-model';

vi.mock('../../../../../composables/use-toast', () => ({
  useToast: vi.fn(() => ({
    warning: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  })),
}));

vi.mock('../../../../../stores/models', () => ({
  useModelsStore: vi.fn(() => ({
    getModel: vi.fn((name: string) => {
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
    }),
    maxNumCtxForModel: vi.fn(() => '4096'),
    formatCtx: vi.fn((n: number) => String(n)),
    modelsLoading: false,
    models: [],
    numCtxOptions: [2048, 4096],
    defaultNumCtx: '4096',
  })),
}));

describe('useSelectedModel', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('starts with empty selectedModel when nothing in localStorage', () => {
    const { selectedModel } = useSelectedModel();
    expect(selectedModel.value).toBe('');
  });

  it('reads selectedModel from localStorage', () => {
    localStorage.setItem('harness-selected-model', 'llama3');
    const { selectedModel } = useSelectedModel();
    expect(selectedModel.value).toBe('llama3');
  });

  it('hasNoModelSelected is true when no model set', () => {
    const { hasNoModelSelected } = useSelectedModel();
    expect(hasNoModelSelected.value).toBe(true);
  });

  it('hasNoModelSelected is false when localStorage has a model', () => {
    localStorage.setItem('harness-selected-model', 'llama3');
    const { hasNoModelSelected } = useSelectedModel();
    expect(hasNoModelSelected.value).toBe(false);
  });

  it('changeModel persists to localStorage and conversation store', () => {
    const conversationStore = useConversationStore();
    const conversation = conversationStore.ensureConversation();
    conversationStore.setActiveConversation(conversation.id);

    const { selectedModel, changeModel } = useSelectedModel();
    changeModel('mistral');
    expect(selectedModel.value).toBe('mistral');
    expect(localStorage.getItem('harness-selected-model')).toBe('mistral');
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
