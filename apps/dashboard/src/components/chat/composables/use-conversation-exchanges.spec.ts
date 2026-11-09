import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Conversation } from '@/stores/chat/conversation/conversation.model';
import { useConversationStore } from '@/stores/chat/conversation/conversation.store';
import { createConversation } from '@/stores/chat/conversation/helpers/create-conversation.helper';
import { useMergeSelectionStore } from '@/stores/chat/conversation/merge-selection/merge-selection.store';

import { useConversationExchanges } from './use-conversation-exchanges';

const catalog = vi.hoisted(() => ({ loadConversationForWrite: vi.fn() }));
const persistence = vi.hoisted(() => ({
  persistConversation: vi.fn(async () => {}),
}));

vi.mock('./use-conversation-catalog', () => ({
  useConversationCatalog: () => catalog,
}));
vi.mock('./use-conversation-persistence', () => ({
  useConversationPersistence: () => persistence,
}));

function seed(loaded = true): Conversation {
  const conversation = createConversation('New chat', {
    conversationId: 'server-1',
  });
  conversation.loaded = loaded;
  useConversationStore().insertConversation(conversation);
  return conversation;
}

function add(
  conversation: Conversation,
  role: 'user' | 'assistant',
  requestId = 'request-1',
) {
  return useConversationStore().addExchange(
    conversation.id,
    {
      role,
      content: role === 'user' ? 'Question' : 'Answer',
      requestId,
      status: 'done',
    },
    'New chat',
  )!;
}

describe('useConversationExchanges', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    persistence.persistConversation.mockResolvedValue(undefined);
    catalog.loadConversationForWrite.mockImplementation(async (id: string) =>
      useConversationStore().getConversation(id),
    );
  });

  it('adds an exchange and persists once', async () => {
    const conversation = seed();

    const added = await useConversationExchanges().addExchange(
      conversation.id,
      { role: 'user', content: 'Hello', status: 'done' },
    );

    expect(added?.id).toBeTruthy();
    expect(conversation.title).toBe('Hello');
    expect(persistence.persistConversation).toHaveBeenCalledTimes(1);
    expect(persistence.persistConversation).toHaveBeenCalledWith(conversation);
  });

  it('hydrates a stub before writing', async () => {
    const conversation = seed(false);
    catalog.loadConversationForWrite.mockImplementation(async (id: string) => {
      const loaded = useConversationStore().getConversation(id)!;
      loaded.loaded = true;
      return loaded;
    });

    await useConversationExchanges().addExchange(conversation.id, {
      role: 'user',
      content: 'Loaded write',
      status: 'done',
    });

    expect(catalog.loadConversationForWrite).toHaveBeenCalledWith(
      conversation.id,
    );
    expect(conversation.exchanges).toHaveLength(1);
    expect(persistence.persistConversation).toHaveBeenCalledTimes(1);
  });

  it('toggles and deletes complete pairs', async () => {
    const conversation = seed();
    const user = add(conversation, 'user');
    add(conversation, 'assistant');
    const exchanges = useConversationExchanges();

    await exchanges.toggleExchangeIncluded(conversation.id, user.id);
    expect(conversation.exchanges.every((exchange) => !exchange.included)).toBe(
      true,
    );
    await exchanges.deleteExchangeAndPrune(conversation.id, user.id);
    expect(conversation.exchanges).toHaveLength(0);
    expect(persistence.persistConversation).toHaveBeenCalledTimes(2);
  });

  it('prunes only the deleted pair from merge selection', async () => {
    const conversation = seed();
    const firstUser = add(conversation, 'user', 'request-1');
    const firstAssistant = add(conversation, 'assistant', 'request-1');
    const secondUser = add(conversation, 'user', 'request-2');
    const secondAssistant = add(conversation, 'assistant', 'request-2');
    const mergeSelectionStore = useMergeSelectionStore();
    mergeSelectionStore.setMergeSelectedIds(conversation.id, [
      firstUser.id,
      firstAssistant.id,
      secondUser.id,
      secondAssistant.id,
    ]);

    await useConversationExchanges().deleteExchangeAndPrune(
      conversation.id,
      firstUser.id,
    );

    expect(mergeSelectionStore.getMergeSelectedIds(conversation.id)).toEqual([
      secondUser.id,
      secondAssistant.id,
    ]);
  });
});
