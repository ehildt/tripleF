import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { createConversation } from './helpers/create-conversation.helper';
import type { Conversation } from './conversation.model';
import { useConversationStore } from './conversation.store';

function seedConversation(overrides: Partial<Conversation> = {}): Conversation {
  const store = useConversationStore();
  const conversation = createConversation('New chat', {
    conversationId: 'server-1',
    ...overrides,
  });
  if (overrides.loaded !== undefined) conversation.loaded = overrides.loaded;
  store.insertConversation(conversation);
  return conversation;
}

function seedExchange(
  conversation: Conversation,
  role: 'user' | 'assistant',
  requestId: string,
  content = role === 'user' ? 'Question' : 'Answer',
) {
  return useConversationStore().addExchange(
    conversation.id,
    {
      role,
      content,
      requestId,
      status: 'done',
      conversationId: conversation.conversationId,
    },
    'New chat',
  )!;
}

describe('useConversationStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('merges stubs without replacing newer in-memory records', () => {
    const current = seedConversation();
    const persistedCopy = {
      ...createConversation('Persisted copy', {
        conversationId: current.conversationId,
      }),
      id: current.id,
    };
    const loaded = {
      ...createConversation('Loaded', {
        conversationId: 'server-loaded',
      }),
      id: 'loaded-stub',
      loaded: false,
    };

    useConversationStore().mergeConversationStubs([persistedCopy, loaded]);

    const store = useConversationStore();
    expect(store.conversations).toHaveLength(2);
    expect(store.getConversation(current.id)?.id).toBe(current.id);
    expect(store.hydrated).toBe(true);
  });

  it('applies loaded content and recalculates context usage', () => {
    const stub = seedConversation({ loaded: false, exchanges: [] });
    const loaded = createConversation('Loaded', {
      id: stub.id,
      conversationId: stub.conversationId,
      numCtx: '100',
    });
    loaded.exchanges = [
      {
        id: 'assistant-1',
        role: 'assistant',
        content: 'Answer',
        status: 'done',
        timestamp: 1,
        inputTokenDelta: 25,
        evalCount: 25,
      },
    ];

    const result = useConversationStore().applyLoadedConversation(
      stub.conversationId,
      loaded,
    );

    expect(result.id).toBe(stub.id);
    expect(stub.loaded).toBe(true);
    expect(stub.contextUsagePercent).toBe('50.00');
  });

  it('reads stable ids without minting', () => {
    const conversation = seedConversation();
    const store = useConversationStore();

    expect(store.getConversationId(conversation.id)).toBe('server-1');
    expect(store.getConversationId('missing')).toBe('');
  });

  it('appends and patches exchanges without performing I/O', () => {
    const conversation = seedConversation();
    const user = seedExchange(
      conversation,
      'user',
      'request-1',
      '<p>Hello</p>',
    );
    const assistant = seedExchange(conversation, 'assistant', 'request-1');

    expect(conversation.title).toBe('<p>Hello</p>');
    expect(user.id).toBeTruthy();
    expect(assistant.timestamp).toBeGreaterThan(0);

    expect(
      useConversationStore().patchAssistantExchange(
        conversation.id,
        'request-1',
        { content: 'Streaming', status: 'streaming' },
        true,
      ),
    ).toBe(true);
    expect(assistant.content).toBe('Streaming');
    expect(assistant.status).toBe('streaming');
  });

  it('replaces exchanges and consumes only named merge sources', () => {
    const conversation = seedConversation();
    const origin = seedExchange(conversation, 'user', 'origin-1');
    const store = useConversationStore();

    expect(
      store.replaceExchanges(conversation.id, [{ ...origin, included: true }]),
    ).toBe(true);
    store.consumeMergedSources(conversation.id, 'merge-request', ['origin-1']);

    expect(conversation.exchanges[0].included).toBe(false);
    expect(conversation.exchanges[0].mergedInto).toBe('merge-request');
  });

  it('patches uploaded media only for loaded records', () => {
    const conversation = seedConversation();
    const store = useConversationStore();

    expect(
      store.patchConversationMedia(conversation.id, {
        uploadedImages: [
          { name: 'image', hash: 'image', uploadedAt: 1, selected: true },
        ],
        imageSelectionSnapshot: { image: true },
      }),
    ).toBe(true);
    expect(conversation.uploadedImages).toHaveLength(1);
    expect(conversation.imageSelectionSnapshot).toEqual({ image: true });

    conversation.loaded = false;
    expect(
      store.patchConversationMedia(conversation.id, { uploadedImages: [] }),
    ).toBe(false);
    expect(conversation.uploadedImages).toHaveLength(1);
  });

  it('deletes only the current context and removes the record when empty', () => {
    const conversation = seedConversation();
    const store = useConversationStore();
    seedExchange(conversation, 'user', 'current');
    conversation.uploadedImages = [
      {
        name: 'image',
        hash: 'image-hash',
        uploadedAt: 1,
        conversationId: conversation.conversationId,
      },
    ];

    const result = store.deleteConversationContext(
      conversation.id,
      conversation.conversationId,
    );

    expect(result?.recordRemoved).toBe(true);
    expect(result?.removedImages.map((image) => image.hash)).toEqual([
      'image-hash',
    ]);
    expect(store.conversations).toHaveLength(0);
  });

  it('retains other contexts and removes empty records', () => {
    const first = seedConversation();
    seedExchange(first, 'user', 'other', 'Other');
    first.exchanges[0].conversationId = 'other-context';
    seedExchange(first, 'user', 'current', 'Current');
    const second = seedConversation({ conversationId: 'server-2' });
    seedExchange(second, 'user', 'current');
    const store = useConversationStore();

    const retained = store.deleteConversationContext(first.id, 'other-context');
    expect(retained?.recordRemoved).toBe(false);
    expect(first.exchanges).toHaveLength(1);

    const secondResult = store.deleteConversationContext(second.id, 'server-2');
    expect(secondResult?.recordRemoved).toBe(true);
    expect(store.conversations).toHaveLength(1);
  });
});
