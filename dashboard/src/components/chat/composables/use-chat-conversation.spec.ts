import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useConversationStore } from '@/stores/conversation';
import { useSocketStore } from '@/stores/socket';

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
      {
        id: '1',
        role: 'user',
        content: 'hello',
        included: true,
        contextPercent: undefined,
      },
    ]);
  });

  it('branches the conversation at the user prompt with the given index', () => {
    const conversationStore = useConversationStore();
    const socketStore = useSocketStore();
    vi.spyOn(socketStore, 'ensureSocketConnection').mockImplementation(
      () => {},
    );
    vi.spyOn(socketStore, 'listenToEvent').mockImplementation(() => {});
    vi.spyOn(socketStore, 'joinRoom').mockImplementation(() => {});

    const conversation = conversationStore.ensureConversation();
    conversation.model = 'test-model';
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

    const { branchUserExchange } = useChatConversation();
    branchUserExchange(0);

    const branched = conversationStore.getConversation(
      conversationStore.activeConversationId!,
    );
    expect(branched).toBeDefined();
    expect(branched!.id).not.toBe(conversation.id);
    expect(branched!.model).toBe('test-model');
    expect(branched!.exchanges).toHaveLength(2);
    expect(branched!.title).toBe('hello');
    expect(socketStore.ensureSocketConnection).toHaveBeenCalled();
  });

  it('ignores branch requests for out-of-range history indices', () => {
    const conversationStore = useConversationStore();
    const conversation = conversationStore.ensureConversation();
    conversationStore.setActiveConversation(conversation.id);

    const { branchUserExchange } = useChatConversation();
    branchUserExchange(5);

    expect(conversationStore.activeConversationId).toBe(conversation.id);
  });
});
