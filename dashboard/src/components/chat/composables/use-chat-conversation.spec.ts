import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { useConversationStore } from '@/stores/conversation';

import { useChatConversation } from './use-chat-conversation';

describe('useChatConversation', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('returns empty values when no conversation is active', () => {
    const { conversationId, conversation, userExchanges, messageListItems } =
      useChatConversation();

    expect(conversationId.value).toBe('');
    expect(conversation.value).toBeNull();
    expect(userExchanges.value).toEqual([]);
    expect(messageListItems.value).toEqual([]);
  });

  it('derives user exchanges and prompt list items from the active conversation', () => {
    const conversationStore = useConversationStore();
    const conversation = conversationStore.ensureConversation();
    conversation.exchanges = [
      {
        id: '1',
        role: 'user',
        content: 'hello',
        status: 'done',
        timestamp: 0,
      },
      {
        id: '2',
        role: 'assistant',
        content: 'hi',
        status: 'done',
        timestamp: 0,
      },
    ];
    conversationStore.setActiveConversation(conversation.id);

    const { userExchanges, messageListItems } = useChatConversation();

    expect(userExchanges.value).toHaveLength(1);
    expect(userExchanges.value[0].content).toBe('hello');
    expect(messageListItems.value).toEqual([
      { role: 'user', content: 'hello', included: true, contextPercent: '--' },
    ]);
  });
});
