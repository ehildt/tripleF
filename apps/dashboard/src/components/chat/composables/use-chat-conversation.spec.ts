import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { useConversationStore } from '@/stores/conversation';

import { useChatConversation } from './use-chat-conversation';

describe('useChatConversation', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('returns empty values when no conversation is active', () => {
    const { conversationId, conversation, selectedModelObj } =
      useChatConversation();

    expect(conversationId.value).toBe('');
    expect(conversation.value).toBeNull();
    expect(selectedModelObj.value).toBeNull();
  });

  it('exposes the active conversation and its id', () => {
    const conversationStore = useConversationStore();
    const conversation = conversationStore.ensureConversation();
    conversationStore.setActiveConversation(conversation.id);

    const { conversationId, conversation: active } = useChatConversation();

    expect(conversationId.value).toBe(conversation.id);
    expect(active.value?.id).toBe(conversation.id);
  });
});
