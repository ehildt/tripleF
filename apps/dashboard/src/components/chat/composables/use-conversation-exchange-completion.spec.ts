import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Conversation } from '@/stores/chat/conversation/conversation.model';
import { useConversationStore } from '@/stores/chat/conversation/conversation.store';
import { createConversation } from '@/stores/chat/conversation/helpers/create-conversation.helper';
import { useMergeSelectionStore } from '@/stores/chat/conversation/merge-selection/merge-selection.store';

import { useConversationExchangeCompletion } from './use-conversation-exchange-completion';

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
  useConversationStore().insertConversation(conversation);
  return conversation;
}

function add(
  conversation: Conversation,
  role: 'user' | 'assistant',
  requestId: string,
  content = role === 'user' ? 'Question' : 'Answer',
) {
  return useConversationStore().addExchange(
    conversation.id,
    { role, content, requestId, status: 'done' },
    'New chat',
  )!;
}

describe('useConversationExchangeCompletion', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    persistence.persistConversation.mockResolvedValue(undefined);
    catalog.loadConversationForWrite.mockImplementation(async (id: string) =>
      useConversationStore().getConversation(id),
    );
  });

  it('finalizes tokens and merge sources and resolves pending selection', async () => {
    const conversation = seed();
    const firstUser = add(conversation, 'user', 'origin-1', 'First');
    add(conversation, 'assistant', 'origin-1');
    const secondUser = add(conversation, 'user', 'origin-2', 'Second');
    add(conversation, 'assistant', 'origin-2');
    const merged = add(conversation, 'user', 'merge-request', 'Merged');
    merged.mergeOrigin = ['origin-1', 'origin-2'];
    const assistant = add(conversation, 'assistant', 'merge-request');
    const mergeSelectionStore = useMergeSelectionStore();
    mergeSelectionStore.setMergeSelectedIds(conversation.id, [
      firstUser.id,
      secondUser.id,
    ]);
    mergeSelectionStore.markMergePending(conversation.id, 'merge-request');

    await useConversationExchangeCompletion().markExchangeDone(
      conversation.id,
      'merge-request',
      { promptEvalCount: 100, evalCount: 20 },
    );

    expect(assistant.status).toBe('done');
    expect(assistant.promptEvalCount).toBe(100);
    expect(assistant.evalCount).toBe(20);
    expect(assistant.inputTokenDelta).toBeTypeOf('number');
    expect(firstUser.included).toBe(false);
    expect(secondUser.mergedInto).toBe('merge-request');
    expect(
      mergeSelectionStore.getPendingMergeRequest(conversation.id),
    ).toBeUndefined();
    expect(mergeSelectionStore.getMergeSelectedIds(conversation.id)).toEqual(
      [],
    );
    expect(persistence.persistConversation).toHaveBeenCalledTimes(1);
  });

  it('marks errors without consuming merge sources', async () => {
    const conversation = seed();
    const origin = add(conversation, 'user', 'origin-1');
    const merged = add(conversation, 'user', 'merge-request');
    merged.mergeOrigin = ['origin-1'];
    const assistant = add(conversation, 'assistant', 'merge-request');
    const mergeSelectionStore = useMergeSelectionStore();
    mergeSelectionStore.setMergeSelectedIds(conversation.id, [origin.id]);
    mergeSelectionStore.markMergePending(conversation.id, 'merge-request');

    await useConversationExchangeCompletion().markExchangeError(
      conversation.id,
      'merge-request',
      'Failed',
    );

    expect(assistant.status).toBe('error');
    expect(assistant.content).toBe('Failed');
    expect(origin.included).not.toBe(false);
    expect(
      mergeSelectionStore.getPendingMergeRequest(conversation.id),
    ).toBeUndefined();
    expect(persistence.persistConversation).toHaveBeenCalledTimes(1);
  });

  it('preserves done and error persistence semantics without an assistant', async () => {
    const conversation = seed();
    const completion = useConversationExchangeCompletion();

    await completion.markExchangeDone(conversation.id, 'missing');
    expect(persistence.persistConversation).toHaveBeenCalledTimes(1);

    await completion.markExchangeError(conversation.id, 'missing', 'Failed');
    expect(persistence.persistConversation).toHaveBeenCalledTimes(1);
    expect(conversation.exchanges).toHaveLength(0);
  });
});
