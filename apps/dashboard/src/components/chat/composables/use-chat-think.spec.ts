import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type Ref } from 'vue';

import { useConversationStore } from '@/stores/conversation';

import { useChatThink } from './use-chat-think';

const toast = vi.hoisted(() => ({ warning: vi.fn() }));

vi.mock('@/composables/use-toast', () => ({ useToast: () => toast }));

vi.mock('@/i18n/i18n', () => ({
  i18n: { global: { t: (key: string) => key } },
}));

/** Drives the mocked `useChatConversation` return values per test. */
const chatConversation = vi.hoisted(() => ({})) as {
  conversationId: Ref<string>;
  selectedModel: Ref<{ capabilities?: string[] } | null>;
};

vi.mock('./use-chat-conversation', async () => {
  const { computed, ref } = await import('vue');
  const conversationId = ref('');
  const selectedModel = ref<{ capabilities?: string[] } | null>(null);
  chatConversation.conversationId = conversationId;
  chatConversation.selectedModel = selectedModel;
  return {
    useChatConversation: () => ({
      conversationId,
      selectedModelObj: computed(() => selectedModel.value),
    }),
  };
});

describe('useChatThink', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.restoreAllMocks();
    toast.warning.mockClear();
    chatConversation.conversationId.value = '';
    chatConversation.selectedModel.value = null;
  });

  it('defaults to medium', () => {
    const { selectedThink } = useChatThink();
    expect(selectedThink.value).toBe('medium');
  });

  it('reads the persisted think level', () => {
    localStorage.setItem('harness-selected-think', 'high');
    const { selectedThink } = useChatThink();
    expect(selectedThink.value).toBe('high');
  });

  it('supports thinking when the model has the capability', () => {
    chatConversation.selectedModel.value = { capabilities: ['thinking'] };
    const { supportsThink, filteredThinkOptions } = useChatThink();
    expect(supportsThink.value).toBe(true);
    expect(filteredThinkOptions.value).toEqual([
      'off',
      'low',
      'medium',
      'high',
    ]);
  });

  it('restricts options to off when the model lacks thinking', () => {
    chatConversation.selectedModel.value = { capabilities: [] };
    const { supportsThink, filteredThinkOptions } = useChatThink();
    expect(supportsThink.value).toBe(false);
    expect(filteredThinkOptions.value).toEqual(['off']);
  });

  it('selectThink persists and updates the conversation', () => {
    chatConversation.conversationId.value = 'conv-1';
    const conversationStore = useConversationStore();
    const setThink = vi
      .spyOn(conversationStore, 'setThink')
      .mockImplementation(() => {});

    const { selectThink } = useChatThink();
    selectThink('low');

    expect(localStorage.getItem('harness-selected-think')).toBe('low');
    expect(setThink).toHaveBeenCalledWith('conv-1', 'low');
  });

  it('selectThink does not touch the store without a conversation id', () => {
    chatConversation.conversationId.value = '';
    const conversationStore = useConversationStore();
    const setThink = vi
      .spyOn(conversationStore, 'setThink')
      .mockImplementation(() => {});

    const { selectThink } = useChatThink();
    selectThink('off');

    expect(setThink).not.toHaveBeenCalled();
  });

  it('warns and resets to off when a non-thinking model is selected', async () => {
    chatConversation.selectedModel.value = { capabilities: ['thinking'] };
    const { selectedThink } = useChatThink();
    selectedThink.value = 'high';

    chatConversation.selectedModel.value = { capabilities: [] };
    await Promise.resolve();

    expect(selectedThink.value).toBe('off');
    expect(toast.warning).toHaveBeenCalled();
  });
});
