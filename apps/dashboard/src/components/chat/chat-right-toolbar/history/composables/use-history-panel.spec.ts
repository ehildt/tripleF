import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useConversationCatalog } from '@/components/chat/composables/use-conversation-catalog';
import { useChatView } from '@/components/chat/shared/composables/use-chat-view';
import { useConversationSession } from '@/components/chat/shared/composables/use-conversation-session';
import { useSocket } from '@/composables/use-socket/use-socket';
import { useConversationStore } from '@/stores/chat/conversation/conversation.store';

import { useHistoryPanel } from './use-history-panel';

const { copyMock } = vi.hoisted(() => ({ copyMock: vi.fn() }));

vi.mock('@vueuse/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@vueuse/core')>();
  return { ...actual, useClipboard: () => ({ copy: copyMock }) };
});

describe('useHistoryPanel', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    useConversationSession().setActiveConversationId(null);
    copyMock.mockClear();
    // useChatView is a module-scope singleton — reset it between tests.
    const chatView = useChatView();
    chatView.setActiveUserExchangeId(null);
    chatView.scrollToExchangeRequest.value = null;
  });

  function seedActiveConversation() {
    const conversation = useConversationCatalog().ensureConversation();
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
    useConversationCatalog().setActiveConversation(conversation.id);
  }

  it('reports whether the history section has content', () => {
    seedActiveConversation();

    const { hasHistory } = useHistoryPanel();
    expect(hasHistory.value).toBe(true);

    const conversationStore = useConversationStore();
    const conversation = conversationStore.getConversation(
      useConversationSession().activeConversationId.value!,
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

  it('tracks the active exchange highlight from the chat view', () => {
    seedActiveConversation();
    const chatView = useChatView();

    const { activeUserExchangeId } = useHistoryPanel();
    expect(activeUserExchangeId.value).toBeNull();

    chatView.setActiveUserExchangeId('1');
    expect(activeUserExchangeId.value).toBe('1');
  });

  it('requests a scroll to the section of the clicked row', () => {
    seedActiveConversation();
    const chatView = useChatView();

    const { onPromptClick } = useHistoryPanel();
    onPromptClick(0);

    expect(chatView.scrollToExchangeRequest.value?.exchangeId).toBe('1');
  });

  it('copies the content of the clicked row', () => {
    seedActiveConversation();

    const { onCopy } = useHistoryPanel();
    onCopy(0);

    expect(copyMock).toHaveBeenCalledWith('hello');
  });

  it('branches the conversation at the user prompt with the given index', () => {
    const conversationStore = useConversationStore();
    const socketStore = useSocket();
    vi.spyOn(socketStore, 'ensureSocketConnection').mockImplementation(
      () => {},
    );
    vi.spyOn(socketStore, 'listenToEvent').mockImplementation(() => {});
    vi.spyOn(socketStore, 'joinRoom').mockImplementation(() => {});

    const conversation = useConversationCatalog().ensureConversation();
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
    useConversationCatalog().setActiveConversation(conversation.id);

    const { branchUserExchange } = useHistoryPanel();
    branchUserExchange(0);

    const branched = conversationStore.getConversation(
      useConversationSession().activeConversationId.value!,
    );
    expect(branched).toBeDefined();
    expect(branched!.id).not.toBe(conversation.id);
    expect(branched!.model).toBe('test-model');
    expect(branched!.exchanges).toHaveLength(2);
    expect(branched!.title).toBe('hello');
    expect(socketStore.ensureSocketConnection).toHaveBeenCalled();
  });

  it('ignores branch requests for out-of-range history indices', () => {
    const conversation = useConversationCatalog().ensureConversation();
    useConversationCatalog().setActiveConversation(conversation.id);

    const { branchUserExchange } = useHistoryPanel();
    branchUserExchange(5);

    expect(useConversationSession().activeConversationId.value).toBe(
      conversation.id,
    );
  });
});
