import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Conversation } from '@/stores/chat/conversation/conversation.model';
import { useConversationStore } from '@/stores/chat/conversation/conversation.store';
import { createConversation } from '@/stores/chat/conversation/helpers/create-conversation.helper';

import { useConversationTurns } from './use-conversation-turns';

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

function seed(): Conversation {
  const conversation = createConversation('New chat', {
    conversationId: 'server-1',
  });
  useConversationStore().insertConversation(conversation, true);
  return conversation;
}

describe('useConversationTurns', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    persistence.persistConversation.mockResolvedValue(undefined);
    catalog.loadConversationForWrite.mockImplementation(async (id: string) =>
      useConversationStore().getConversation(id),
    );
  });

  it('seeds active and cross-session turns with one persist per record', async () => {
    const active = seed();
    const other = createConversation('Other', { conversationId: 'server-2' });
    useConversationStore().insertConversation(other, false);
    const turns = useConversationTurns();

    await turns.seedConversationTurn({
      conversationStoreId: active.id,
      exchanges: [{ role: 'user', content: 'Active', status: 'done' }],
      model: 'llama3',
      numCtx: '8192',
      think: 'high',
      stream: false,
      event: 'event',
      roomId: 'room',
      patchConfiguration: true,
      defaultTitle: 'New chat',
    });
    await turns.seedConversationTurn({
      conversationStoreId: other.id,
      exchanges: [{ role: 'user', content: 'Other', status: 'done' }],
      model: 'different-model',
      numCtx: '1',
      think: 'off',
      stream: true,
      event: 'event',
      roomId: 'room',
      patchConfiguration: false,
      defaultTitle: 'Other',
    });

    expect(active.model).toBe('llama3');
    expect(active.numCtx).toBe('8192');
    expect(other.model).toBe('');
    expect(other.numCtx).toBe('');
    expect(persistence.persistConversation).toHaveBeenCalledTimes(2);
  });

  it('prepares and resets a retry turn with one persist per preparation', async () => {
    const conversation = seed();
    const turns = useConversationTurns();
    const preparation = {
      conversationStoreId: conversation.id,
      requestId: 'job-1',
      serverConversationId: conversation.conversationId,
      model: 'llama3',
      event: 'harness',
      roomId: 'room',
      numCtx: '4096',
      think: 'low',
      stream: false,
      failedPrompt: 'Retry me',
      defaultTitle: 'New chat',
    };

    await turns.prepareConversationRetry(preparation);
    expect(conversation.exchanges.map((exchange) => exchange.role)).toEqual([
      'user',
      'assistant',
    ]);
    conversation.exchanges[1].content = 'Previous failure';
    conversation.exchanges[1].responseTemplate = 'text';
    await turns.prepareConversationRetry(preparation);

    expect(conversation.exchanges).toHaveLength(2);
    expect(conversation.exchanges[1].content).toBe('');
    expect(conversation.exchanges[1].status).toBe('pending');
    expect(conversation.exchanges[1].responseTemplate).toBeUndefined();
    expect(persistence.persistConversation).toHaveBeenCalledTimes(2);
  });
});
