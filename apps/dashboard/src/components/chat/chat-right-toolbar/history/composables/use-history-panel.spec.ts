import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useChatViewStore } from '@/stores/chat-view';
import { useConversationStore } from '@/stores/conversation';
import { useSocketStore } from '@/stores/socket';

import { useHistoryPanel } from './use-history-panel';

const { copyMock } = vi.hoisted(() => ({ copyMock: vi.fn() }));

vi.mock('@vueuse/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@vueuse/core')>();
  return { ...actual, useClipboard: () => ({ copy: copyMock }) };
});

describe('useHistoryPanel', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    copyMock.mockClear();
  });

  function seedActiveConversation() {
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
  }

  it('reports whether the history section has content', () => {
    seedActiveConversation();

    const { hasHistory } = useHistoryPanel();
    expect(hasHistory.value).toBe(true);

    const conversationStore = useConversationStore();
    const conversation = conversationStore.getConversation(
      conversationStore.activeConversationId!,
    )!;
    conversation.exchanges = [];
    expect(hasHistory.value).toBe(false);
  });

  it('maps the active conversation into history rows', () => {
    seedActiveConversation();

    const { messageListItems, canMerge, mergeArmed } = useHistoryPanel();

    expect(messageListItems.value).toHaveLength(1);
    expect(messageListItems.value[0]).toEqual({
      id: '1',
      role: 'user',
      content: 'hello',
      included: true,
      mergeSelected: false,
      merged: false,
      contextPercent: undefined,
    });
    expect(canMerge.value).toBe(false);
    expect(mergeArmed.value).toBe(false);
  });

  it('tracks the active exchange highlight from the chat-view store', () => {
    seedActiveConversation();
    const chatViewStore = useChatViewStore();

    const { activeUserExchangeId } = useHistoryPanel();
    expect(activeUserExchangeId.value).toBeNull();

    chatViewStore.setActiveUserExchangeId('1');
    expect(activeUserExchangeId.value).toBe('1');
  });

  it('requests a scroll to the section of the clicked row', () => {
    seedActiveConversation();
    const chatViewStore = useChatViewStore();

    const { onPromptClick } = useHistoryPanel();
    onPromptClick(0);

    expect(chatViewStore.scrollToExchangeRequest?.exchangeId).toBe('1');
  });

  it('copies the content of the clicked row', () => {
    seedActiveConversation();

    const { onCopy } = useHistoryPanel();
    onCopy(0);

    expect(copyMock).toHaveBeenCalledWith('hello');
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

    const { branchUserExchange } = useHistoryPanel();
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

    const { branchUserExchange } = useHistoryPanel();
    branchUserExchange(5);

    expect(conversationStore.activeConversationId).toBe(conversation.id);
  });
});
