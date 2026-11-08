import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useConversationCatalog } from '@/components/chat/composables/use-conversation-catalog';
import { useConversationStore } from '@/stores/chat/conversation/conversation.store';

import { useModelsStore } from '../models/models.store';
import { useMessagesStore } from './messages.store';

vi.mock('@/components/app/composables/use-chat-response-activity', () => ({
  useChatResponseActivity: () => ({ notifyChatResponse: vi.fn() }),
}));

vi.mock('../../api/conversations.api', () => ({
  fetchConversations: vi.fn().mockResolvedValue([]),
  fetchConversation: vi.fn(),
  saveConversation: vi.fn().mockResolvedValue(undefined),
  deleteConversation: vi.fn().mockResolvedValue(undefined),
}));

/** Build a v1 harness envelope as the socket listener now hands it over. */
function envelope(type: string, data: unknown, requestId = 'req-1') {
  return {
    v: 1 as const,
    kind: 'event' as const,
    type,
    id: `${requestId}-${type}`,
    at: new Date().toISOString(),
    meta: { requestId },
    data,
  };
}

const delta = (text: string, template?: string, requestId = 'req-1') =>
  envelope('harness:delta', { channel: 'content', text, template }, requestId);

const completed = (data: Record<string, unknown>, requestId = 'req-1') =>
  envelope('harness:completed', { usage: {}, ...data }, requestId);

describe('useMessagesStore', () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    localStorage.clear();
    // The conversation store hydrates persisted conversations asynchronously
    // on creation — settle before seeding a conversation, or the load result
    // would wipe it mid-test.
    useConversationStore();
    await new Promise((resolve) => setTimeout(resolve, 0));
    useConversationCatalog().createNewConversation('temporary', 'harness', '');
  });

  it('initializes with empty messages', () => {
    const store = useMessagesStore();
    expect(store.messages).toEqual([]);
    expect(store.completedCount).toBe(0);
  });

  it('addPendingMessage creates a pending message', () => {
    const store = useMessagesStore();
    store.addPendingMessage('harness', 'room-1', 'req-1', true);
    expect(store.messages).toHaveLength(1);
    expect(store.messages[0].data.pending).toBe(true);
    expect(store.messages[0].data.requestId).toBe('req-1');
    expect(store.messages[0].data.event).toBe('harness');
  });

  it('completed events land the assistant content and mark tracking done', () => {
    const store = useMessagesStore();
    store.addPendingMessage('harness', 'room-1', 'req-1');
    store.addMessage(
      'harness',
      completed({ template: 'text', result: 'result' }),
    );

    expect(store.messages).toHaveLength(1);
    expect(store.messages[0].data.done).toBe(true);
    expect(store.messages[0].data.pending).toBeUndefined();

    const conversationStore = useConversationStore();
    const [exchange] = conversationStore.conversations[0].exchanges;
    expect(exchange.role).toBe('assistant');
    expect(exchange.content).toBe('result');
    expect(exchange.status).toBe('done');
  });

  it('ignores canceled envelopes without an assistant exchange', () => {
    const store = useMessagesStore();
    store.addMessage(
      'harness',
      envelope('harness:cancelled', { success: true }),
    );
    expect(useConversationStore().conversations[0].exchanges).toHaveLength(0);
    expect(store.messages).toHaveLength(0);
  });

  it('accepts untracked requestIds on completed events', () => {
    const store = useMessagesStore();
    store.addMessage(
      'harness',
      completed({ template: 'text', result: 'x' }, 'unknown'),
    );

    expect(store.messages).toHaveLength(1);
    expect(store.messages[0].data.requestId).toBe('unknown');
    expect(useConversationStore().conversations[0].exchanges[0].content).toBe(
      'x',
    );
  });

  it('removeMessage deletes by requestId', () => {
    const store = useMessagesStore();
    store.addPendingMessage('harness', 'room-1', 'req-1');
    store.removeMessage('req-1');
    expect(store.messages).toHaveLength(0);
  });

  it('updatePendingMessage updates existing pending', () => {
    const store = useMessagesStore();
    store.addPendingMessage('harness', 'room-1', 'req-1');
    store.updatePendingMessage('req-1', {
      event: 'harness',
      done: true,
      conversationId: 's1',
    });
    expect(store.messages[0].data.conversationId).toBe('s1');
    expect(store.messages[0].data.done).toBe(true);
    expect(store.messages[0].data.pending).toBe(false);
  });

  it('streams harness content deltas into the exchange', () => {
    const store = useMessagesStore();
    store.addMessage('harness', delta('{"title":"Image"', 'describe'));

    const [exchange] = useConversationStore().conversations[0].exchanges;
    expect(exchange.role).toBe('assistant');
    expect(exchange.responseTemplate).toBe('describe');
    expect(exchange.responseData?.title).toBe('Image');
    expect(exchange.status).toBe('streaming');
  });

  it('finalizes harness streaming on the completed envelope', () => {
    const store = useMessagesStore();
    store.addMessage('harness', delta('{"title":"Image"', 'article'));
    store.addMessage(
      'harness',
      completed({
        template: 'article',
        data: {
          title: 'Image',
          sectionContent: 'A scene',
          galleryItems: [
            {
              imageUrl: 'data:image/png;base64,abc',
              imageAlt: 'photo',
              title: 'photo',
              caption: 'caption',
            },
          ],
        },
      }),
    );

    const [exchange] = useConversationStore().conversations[0].exchanges;
    expect(exchange.status).toBe('done');
    expect(exchange.responseData?.galleryItems).toHaveLength(1);
    expect(exchange.responseData?.galleryItems?.[0].imageUrl).toBe(
      'data:image/png;base64,abc',
    );
    expect(exchange.responseData?.sectionContent).toBe('A scene');
  });

  it('applies the authoritative data payload after a stream-validation retry', () => {
    const store = useMessagesStore();
    // The model ignored the article JSON schema and streamed markdown prose,
    // so the harness discarded the stream and retried non-streaming. The
    // completed envelope carries the validated article in `data`.
    store.addMessage(
      'harness',
      delta('Ja, ich kenne *Neverness to Everness* (NTE).', 'article'),
    );
    store.addMessage(
      'harness',
      completed({
        template: 'article',
        result: '',
        data: {
          category: 'Gaming',
          title: 'Neverness to Everness (NTE)',
          summary: 'Ein Open-World-Action-RPG.',
        },
      }),
    );

    const [exchange] = useConversationStore().conversations[0].exchanges;
    expect(exchange.status).toBe('done');
    expect(exchange.responseTemplate).toBe('article');
    expect(exchange.responseData?.title).toBe('Neverness to Everness (NTE)');
    expect(exchange.content).toBe('Neverness to Everness (NTE)');
  });

  it('handles text template harness events', () => {
    const store = useMessagesStore();
    // Streamed text: content deltas arrive first; the completed envelope
    // carries no `result` (the server only sets it for non-streamed turns).
    store.addMessage('harness', delta('Hello world', 'text'));
    store.addMessage('harness', completed({ template: 'text' }));

    const [exchange] = useConversationStore().conversations[0].exchanges;
    expect(exchange.text).toBe('Hello world');
    expect(exchange.content).toBe('Hello world');
    expect(exchange.status).toBe('done');
  });

  it('renders a non-streamed text result carried on the completed envelope', () => {
    const store = useMessagesStore();
    // Non-streamed: no content deltas; the completed envelope's `result` is
    // the only channel the validated text reaches the client on.
    store.addMessage(
      'harness',
      completed({ template: 'text', result: 'Full text' }),
    );

    const [exchange] = useConversationStore().conversations[0].exchanges;
    expect(exchange.text).toBe('Full text');
    expect(exchange.content).toBe('Full text');
    expect(exchange.status).toBe('done');
  });

  it('backfills numCtx from the model when a response completes with token data', () => {
    const modelsStore = useModelsStore();
    modelsStore.models = [{ model: 'llama3', context_length: 4096 }];
    modelsStore.numCtxOptions = [2048, 4096];

    const conversationStore = useConversationStore();
    conversationStore.conversations[0].model = 'llama3';

    const store = useMessagesStore();
    store.addMessage(
      'harness',
      completed({
        template: 'text',
        result: 'Hello world',
        usage: { promptEvalCount: 100, evalCount: 50 },
      }),
    );

    expect(conversationStore.conversations[0].numCtx).toBe('4096');
  });

  it('clears pending on done without content', () => {
    const store = useMessagesStore();
    store.addPendingMessage('harness', 'room-1', 'req-1');
    store.addMessage('harness', completed({ template: 'text', result: '' }));

    expect(store.messages[0].data.pending).toBeUndefined();
    expect(store.messages[0].data.done).toBe(true);
  });

  it('renders error messages for harness failures', () => {
    const store = useMessagesStore();
    store.addMessage(
      'harness',
      envelope('harness:failed', { reason: 'Something went wrong' }),
    );

    const [exchange] = useConversationStore().conversations[0].exchanges;
    expect(exchange.content).toContain('Something went wrong');
    expect(exchange.status).toBe('done');
    expect(exchange.content).toContain('Error: Something went wrong');
  });

  it('clearMessages removes everything', () => {
    const store = useMessagesStore();
    store.addPendingMessage('harness', 'room-1', 'req-1');
    store.clearMessages();
    expect(store.messages).toHaveLength(0);
    expect(store.completedCount).toBe(0);
  });

  it('records activity and language on the assistant exchange', () => {
    const store = useMessagesStore();
    const conversationStore = useConversationStore();
    const conversation = conversationStore.conversations[0];
    conversationStore.addExchange(conversation.id, {
      role: 'assistant',
      content: '',
      status: 'pending',
      requestId: 'req-1',
      event: 'harness',
    });

    store.addMessage(
      'harness',
      envelope('harness:activity', { key: 'searching', language: 'de' }),
    );

    const exchange = conversation.exchanges.find((e) => e.role === 'assistant');
    expect(exchange?.activity).toEqual({ key: 'searching' });
    expect(exchange?.activityLanguage).toBe('de');
  });

  it('ignores activity without a key', () => {
    const store = useMessagesStore();
    const conversationStore = useConversationStore();
    conversationStore.addExchange(conversationStore.conversations[0].id, {
      role: 'assistant',
      content: '',
      status: 'pending',
      requestId: 'req-1',
      event: 'harness',
    });

    store.addMessage('harness', envelope('harness:activity', {}));

    const exchange = conversationStore.conversations[0].exchanges.find(
      (e) => e.role === 'assistant',
    );
    expect(exchange?.activity).toBeUndefined();
  });

  it('accumulates parallel tool calls keyed by name and query', () => {
    const store = useMessagesStore();
    const conversationStore = useConversationStore();
    conversationStore.addExchange(conversationStore.conversations[0].id, {
      role: 'assistant',
      content: '',
      status: 'pending',
      requestId: 'req-1',
      event: 'harness',
    });

    store.addMessage(
      'harness',
      envelope('harness:tool-call', {
        name: 'web',
        query: 'cats',
        status: 'start',
      }),
    );
    store.addMessage(
      'harness',
      envelope('harness:tool-call', {
        name: 'web',
        query: 'dogs',
        status: 'start',
      }),
    );

    const exchange = conversationStore.conversations[0].exchanges.find(
      (e) => e.role === 'assistant',
    );
    expect(exchange?.toolCalls).toHaveLength(2);
    expect(exchange?.toolCalls?.map((t) => t.query)).toEqual(['cats', 'dogs']);
  });

  it('clears a finished tool call from the active list', () => {
    const store = useMessagesStore();
    const conversationStore = useConversationStore();
    conversationStore.addExchange(conversationStore.conversations[0].id, {
      role: 'assistant',
      content: '',
      status: 'pending',
      requestId: 'req-1',
      event: 'harness',
    });

    store.addMessage(
      'harness',
      envelope('harness:tool-call', {
        name: 'web',
        query: 'cats',
        status: 'start',
      }),
    );
    store.addMessage(
      'harness',
      envelope('harness:tool-call', {
        name: 'web',
        query: 'cats',
        status: 'done',
      }),
    );

    const exchange = conversationStore.conversations[0].exchanges.find(
      (e) => e.role === 'assistant',
    );
    expect(exchange?.toolCalls).toBeUndefined();
  });

  it('ignores tool calls without a name', () => {
    const store = useMessagesStore();
    const conversationStore = useConversationStore();
    conversationStore.addExchange(conversationStore.conversations[0].id, {
      role: 'assistant',
      content: '',
      status: 'pending',
      requestId: 'req-1',
      event: 'harness',
    });

    store.addMessage(
      'harness',
      envelope('harness:tool-call', { status: 'start' }),
    );

    const exchange = conversationStore.conversations[0].exchanges.find(
      (e) => e.role === 'assistant',
    );
    expect(exchange?.toolCalls).toBeUndefined();
  });

  it('accumulates reasoning deltas on the exchange', () => {
    const store = useMessagesStore();
    const conversationStore = useConversationStore();
    conversationStore.addExchange(conversationStore.conversations[0].id, {
      role: 'assistant',
      content: '',
      status: 'pending',
      requestId: 'req-1',
      event: 'harness',
    });

    store.addMessage(
      'harness',
      envelope('harness:delta', { channel: 'reasoning', text: 'thinking' }),
    );
    store.addMessage(
      'harness',
      envelope('harness:delta', { channel: 'reasoning', text: ' more' }),
    );

    const exchange = conversationStore.conversations[0].exchanges.find(
      (e) => e.role === 'assistant',
    );
    expect(exchange?.reasoning).toBe('thinking more');
    expect(exchange?.status).toBe('pending');
  });

  it('marks a cancelled request done and drops its transient state', () => {
    const store = useMessagesStore();
    const conversationStore = useConversationStore();
    const conversation = conversationStore.conversations[0];
    conversationStore.addExchange(conversation.id, {
      role: 'assistant',
      content: 'partial',
      status: 'streaming',
      requestId: 'req-1',
      event: 'harness',
    });

    store.addMessage('harness', envelope('harness:cancelled', {}));

    const exchange = conversation.exchanges.find((e) => e.role === 'assistant');
    expect(exchange?.status).toBe('done');
    expect(exchange?.activity).toBeUndefined();
    expect(exchange?.reasoning).toBeUndefined();
  });

  it('seeds the user exchange from the completed prompt when absent', () => {
    const store = useMessagesStore();
    const conversationStore = useConversationStore();
    const conversation = conversationStore.conversations[0];

    store.addMessage(
      'harness',
      completed({
        prompt: 'What is Rust?',
        result: 'A language',
        template: 'text',
      }),
    );

    const userExchange = conversation.exchanges.find((e) => e.role === 'user');
    expect(userExchange?.content).toBe('What is Rust?');
    expect(userExchange?.requestId).toBe('req-1');
  });

  it('does not duplicate an existing user exchange', () => {
    const store = useMessagesStore();
    const conversationStore = useConversationStore();
    const conversation = conversationStore.conversations[0];
    conversationStore.addExchange(conversation.id, {
      role: 'user',
      content: 'already there',
      status: 'done',
      requestId: 'req-1',
      event: 'harness',
    });

    store.addMessage('harness', completed({ prompt: 'other', result: 'x' }));

    expect(
      conversation.exchanges.filter((e) => e.role === 'user'),
    ).toHaveLength(1);
  });

  it('tracks unread completed messages until they are marked read', () => {
    const store = useMessagesStore();
    const conversationStore = useConversationStore();
    conversationStore.addExchange(conversationStore.conversations[0].id, {
      role: 'assistant',
      content: '',
      status: 'pending',
      requestId: 'req-1',
      event: 'harness',
    });

    store.addMessage(
      'harness',
      completed({ result: 'done', template: 'text' }),
    );
    expect(store.completedCount).toBe(1);
    expect(store.isRead('req-1')).toBe(false);

    store.markAsRead('req-1');

    expect(store.isRead('req-1')).toBe(true);
    expect(store.completedCount).toBe(0);
  });

  it('forgets read state when a message is removed', () => {
    const store = useMessagesStore();
    const conversationStore = useConversationStore();
    conversationStore.addExchange(conversationStore.conversations[0].id, {
      role: 'assistant',
      content: '',
      status: 'pending',
      requestId: 'req-1',
      event: 'harness',
    });
    store.addMessage(
      'harness',
      completed({ result: 'done', template: 'text' }),
    );
    store.markAsRead('req-1');

    store.removeMessage('req-1');

    expect(store.isRead('req-1')).toBe(false);
  });

  it('applies the completed response before the terminal persistence command', () => {
    const conversationStore = useConversationStore();
    const patch = vi.spyOn(conversationStore, 'patchAssistantExchange');
    const store = useMessagesStore();

    store.addMessage(
      'harness',
      completed({ template: 'text', result: 'final result' }),
    );

    const terminal = patch.mock.calls.findLastIndex(
      ([, , exchangePatch]) => exchangePatch.status === 'done',
    );
    expect(terminal).toBeGreaterThan(0);
    expect(patch.mock.invocationCallOrder[0]).toBeLessThan(
      patch.mock.invocationCallOrder[terminal],
    );
  });

  it('ignores envelopes without a request id or a known type', () => {
    const store = useMessagesStore();
    const conversationStore = useConversationStore();

    store.addMessage('harness', { type: 'harness:delta', data: {} });
    store.addMessage('harness', envelope('harness:unknown', {}));

    expect(conversationStore.conversations[0].exchanges).toHaveLength(0);
  });
});
