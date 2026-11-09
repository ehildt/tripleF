import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useConversationCatalog } from '@/components/chat/composables/use-conversation-catalog';
import { useConversationStore } from '@/stores/chat/conversation/conversation.store';
import { useModelsStore } from '@/stores/models/models.store';
import type { SocketEvent } from '@/types/socket-event.model';

import { useHarnessEvents } from './use-harness-events';
import { useHarnessResponseStreams } from './use-harness-response-streams';

const chatResponseActivity = vi.hoisted(() => ({
  notifyChatResponse: vi.fn(),
}));

vi.mock('@/components/app/composables/use-chat-response-activity', () => ({
  useChatResponseActivity: () => chatResponseActivity,
}));

vi.mock('../../api/conversations.api', () => ({
  fetchConversations: vi.fn().mockResolvedValue([]),
  fetchConversation: vi.fn(),
  saveConversation: vi.fn().mockResolvedValue(undefined),
  deleteConversation: vi.fn().mockResolvedValue(undefined),
}));

/** Build a v1 harness envelope as the socket listener hands it over. */
function envelope(
  type: string,
  data: unknown,
  requestId = 'req-1',
): SocketEvent {
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

const delta = (
  text: string,
  template?: string,
  requestId = 'req-1',
): SocketEvent =>
  envelope('harness:delta', { channel: 'content', text, template }, requestId);

const completed = (
  data: Record<string, unknown>,
  requestId = 'req-1',
): SocketEvent =>
  envelope('harness:completed', { usage: {}, ...data }, requestId);

describe('useHarnessEvents', () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    localStorage.clear();
    chatResponseActivity.notifyChatResponse.mockClear();
    useHarnessResponseStreams().resetHarnessResponseStream('req-1');
    useHarnessResponseStreams().resetHarnessResponseStream('unknown');
    useConversationStore();
    await new Promise((resolve) => setTimeout(resolve, 0));
    useConversationCatalog().createNewConversation('temporary', 'harness', '');
  });

  it('lands completed assistant content in the conversation', () => {
    useHarnessEvents().handleHarnessEvent(
      'harness',
      completed({ template: 'text', result: 'result' }),
    );

    const [exchange] = useConversationStore().conversations[0].exchanges;
    expect(exchange.role).toBe('assistant');
    expect(exchange.content).toBe('result');
    expect(exchange.status).toBe('done');
  });

  it('ignores cancelled envelopes without an assistant exchange', () => {
    useHarnessEvents().handleHarnessEvent(
      'harness',
      envelope('harness:cancelled', { success: true }),
    );

    expect(useConversationStore().conversations[0].exchanges).toHaveLength(0);
    expect(chatResponseActivity.notifyChatResponse).not.toHaveBeenCalled();
  });

  it('accepts untracked request ids on completed events', () => {
    useHarnessEvents().handleHarnessEvent(
      'harness',
      completed({ template: 'text', result: 'x' }, 'unknown'),
    );

    expect(useConversationStore().conversations[0].exchanges[0].content).toBe(
      'x',
    );
  });

  it('streams harness content deltas into the exchange', () => {
    useHarnessEvents().handleHarnessEvent(
      'harness',
      delta('{"title":"Image"', 'describe'),
    );

    const [exchange] = useConversationStore().conversations[0].exchanges;
    expect(exchange.role).toBe('assistant');
    expect(exchange.responseTemplate).toBe('describe');
    expect(exchange.responseData?.title).toBe('Image');
    expect(exchange.status).toBe('streaming');
  });

  it('finalizes harness streaming on the completed envelope', () => {
    const harnessEvents = useHarnessEvents();
    harnessEvents.handleHarnessEvent(
      'harness',
      delta('{"title":"Image"', 'article'),
    );
    harnessEvents.handleHarnessEvent(
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

  it('preserves streamed text when a completed envelope is repeated after cleanup', () => {
    const harnessEvents = useHarnessEvents();
    harnessEvents.handleHarnessEvent('harness', delta('Hello world', 'text'));
    harnessEvents.handleHarnessEvent(
      'harness',
      completed({ template: 'text' }),
    );
    harnessEvents.handleHarnessEvent(
      'harness',
      completed({ template: 'text' }),
    );

    const [exchange] = useConversationStore().conversations[0].exchanges;
    expect(exchange.text).toBe('Hello world');
    expect(exchange.content).toBe('Hello world');
    expect(exchange.status).toBe('done');
  });

  it.each([
    { type: 'harness:completed', data: { template: 'text' } },
    { type: 'harness:failed', data: { reason: 'failed' } },
    { type: 'harness:cancelled', data: { success: true } },
  ])('releases response assembly state on $type', ({ type, data }) => {
    const harnessEvents = useHarnessEvents();
    harnessEvents.handleHarnessEvent('harness', delta('Old', 'text'));
    harnessEvents.handleHarnessEvent('harness', envelope(type, data));

    const next = useHarnessResponseStreams().processHarnessStreamEvent(
      'req-1',
      {
        requestId: 'req-1',
        template: 'text',
        delta: 'Next',
        done: false,
      },
    );
    expect(next.text).toBe('Next');
  });

  it('applies the authoritative data payload after a stream-validation retry', () => {
    const harnessEvents = useHarnessEvents();
    // The completed envelope carries the validated article after the harness
    // discarded invalid streamed prose and regenerated the response.
    harnessEvents.handleHarnessEvent(
      'harness',
      delta('Ja, ich kenne *Neverness to Everness* (NTE).', 'article'),
    );
    harnessEvents.handleHarnessEvent(
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
    const harnessEvents = useHarnessEvents();
    harnessEvents.handleHarnessEvent('harness', delta('Hello world', 'text'));
    harnessEvents.handleHarnessEvent(
      'harness',
      completed({ template: 'text' }),
    );

    const [exchange] = useConversationStore().conversations[0].exchanges;
    expect(exchange.text).toBe('Hello world');
    expect(exchange.content).toBe('Hello world');
    expect(exchange.status).toBe('done');
  });

  it('renders a non-streamed text result carried on the completed envelope', () => {
    useHarnessEvents().handleHarnessEvent(
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

    useHarnessEvents().handleHarnessEvent(
      'harness',
      completed({
        template: 'text',
        result: 'Hello world',
        usage: { promptEvalCount: 100, evalCount: 50 },
      }),
    );

    expect(conversationStore.conversations[0].numCtx).toBe('4096');
  });

  it('completes an empty text response without retaining pending state', () => {
    useHarnessEvents().handleHarnessEvent(
      'harness',
      completed({ template: 'text', result: '' }),
    );

    const [exchange] = useConversationStore().conversations[0].exchanges;
    expect(exchange.content).toBe('');
    expect(exchange.status).toBe('done');
    expect(exchange.activity).toBeUndefined();
  });

  it('renders error messages for harness failures', () => {
    useHarnessEvents().handleHarnessEvent(
      'harness',
      envelope('harness:failed', { reason: 'Something went wrong' }),
    );

    const [exchange] = useConversationStore().conversations[0].exchanges;
    expect(exchange.content).toContain('Something went wrong');
    expect(exchange.status).toBe('done');
    expect(exchange.content).toContain('Error: Something went wrong');
  });

  it('records activity and language on the assistant exchange', () => {
    const conversationStore = useConversationStore();
    conversationStore.addExchange(conversationStore.conversations[0].id, {
      role: 'assistant',
      content: '',
      status: 'pending',
      requestId: 'req-1',
      event: 'harness',
    });

    useHarnessEvents().handleHarnessEvent(
      'harness',
      envelope('harness:activity', { key: 'searching', language: 'de' }),
    );

    const exchange = conversationStore.conversations[0].exchanges.find(
      (item) => item.role === 'assistant',
    );
    expect(exchange?.activity).toEqual({ key: 'searching' });
    expect(exchange?.activityLanguage).toBe('de');
  });

  it('ignores activity without a key', () => {
    const conversationStore = useConversationStore();
    conversationStore.addExchange(conversationStore.conversations[0].id, {
      role: 'assistant',
      content: '',
      status: 'pending',
      requestId: 'req-1',
      event: 'harness',
    });

    useHarnessEvents().handleHarnessEvent(
      'harness',
      envelope('harness:activity', {}),
    );

    const exchange = conversationStore.conversations[0].exchanges.find(
      (item) => item.role === 'assistant',
    );
    expect(exchange?.activity).toBeUndefined();
  });

  it('accumulates parallel tool calls keyed by name and query', () => {
    const conversationStore = useConversationStore();
    conversationStore.addExchange(conversationStore.conversations[0].id, {
      role: 'assistant',
      content: '',
      status: 'pending',
      requestId: 'req-1',
      event: 'harness',
    });

    const harnessEvents = useHarnessEvents();
    harnessEvents.handleHarnessEvent(
      'harness',
      envelope('harness:tool-call', {
        name: 'web',
        query: 'cats',
        status: 'start',
      }),
    );
    harnessEvents.handleHarnessEvent(
      'harness',
      envelope('harness:tool-call', {
        name: 'web',
        query: 'dogs',
        status: 'start',
      }),
    );

    const exchange = conversationStore.conversations[0].exchanges.find(
      (item) => item.role === 'assistant',
    );
    expect(exchange?.toolCalls).toHaveLength(2);
    expect(exchange?.toolCalls?.map((call) => call.query)).toEqual([
      'cats',
      'dogs',
    ]);
  });

  it('clears a finished tool call from the active list', () => {
    const conversationStore = useConversationStore();
    conversationStore.addExchange(conversationStore.conversations[0].id, {
      role: 'assistant',
      content: '',
      status: 'pending',
      requestId: 'req-1',
      event: 'harness',
    });

    const harnessEvents = useHarnessEvents();
    harnessEvents.handleHarnessEvent(
      'harness',
      envelope('harness:tool-call', {
        name: 'web',
        query: 'cats',
        status: 'start',
      }),
    );
    harnessEvents.handleHarnessEvent(
      'harness',
      envelope('harness:tool-call', {
        name: 'web',
        query: 'cats',
        status: 'done',
      }),
    );

    const exchange = conversationStore.conversations[0].exchanges.find(
      (item) => item.role === 'assistant',
    );
    expect(exchange?.toolCalls).toBeUndefined();
  });

  it('ignores tool calls without a name', () => {
    const conversationStore = useConversationStore();
    conversationStore.addExchange(conversationStore.conversations[0].id, {
      role: 'assistant',
      content: '',
      status: 'pending',
      requestId: 'req-1',
      event: 'harness',
    });

    useHarnessEvents().handleHarnessEvent(
      'harness',
      envelope('harness:tool-call', { status: 'start' }),
    );

    const exchange = conversationStore.conversations[0].exchanges.find(
      (item) => item.role === 'assistant',
    );
    expect(exchange?.toolCalls).toBeUndefined();
  });

  it('accumulates reasoning deltas on the exchange', () => {
    const conversationStore = useConversationStore();
    conversationStore.addExchange(conversationStore.conversations[0].id, {
      role: 'assistant',
      content: '',
      status: 'pending',
      requestId: 'req-1',
      event: 'harness',
    });

    const harnessEvents = useHarnessEvents();
    harnessEvents.handleHarnessEvent(
      'harness',
      envelope('harness:delta', { channel: 'reasoning', text: 'thinking' }),
    );
    harnessEvents.handleHarnessEvent(
      'harness',
      envelope('harness:delta', { channel: 'reasoning', text: ' more' }),
    );

    const exchange = conversationStore.conversations[0].exchanges.find(
      (item) => item.role === 'assistant',
    );
    expect(exchange?.reasoning).toBe('thinking more');
    expect(exchange?.status).toBe('pending');
  });

  it('marks cancellation done, clears transient state, and notifies chat activity', () => {
    const conversationStore = useConversationStore();
    const conversation = conversationStore.conversations[0];
    conversationStore.addExchange(conversation.id, {
      role: 'assistant',
      content: 'partial',
      status: 'streaming',
      requestId: 'req-1',
      event: 'harness',
      activity: { key: 'activity.assembling' },
      activityLanguage: 'de',
      reasoning: 'thinking',
      toolCalls: [{ name: 'web', status: 'start' }],
    });

    useHarnessEvents().handleHarnessEvent(
      'harness',
      envelope('harness:cancelled', {}),
    );

    const exchange = conversation.exchanges.find(
      (item) => item.role === 'assistant',
    );
    expect(exchange?.status).toBe('done');
    expect(exchange?.content).toBe('partial');
    expect(exchange?.activity).toBeUndefined();
    expect(exchange?.activityLanguage).toBeUndefined();
    expect(exchange?.reasoning).toBeUndefined();
    expect(exchange?.toolCalls).toBeUndefined();
    expect(chatResponseActivity.notifyChatResponse).toHaveBeenCalledOnce();
  });

  it('seeds the user exchange from the completed prompt when absent', () => {
    const conversationStore = useConversationStore();
    const conversation = conversationStore.conversations[0];

    useHarnessEvents().handleHarnessEvent(
      'harness',
      completed({
        prompt: 'What is Rust?',
        result: 'A language',
        template: 'text',
      }),
    );

    const userExchange = conversation.exchanges.find(
      (exchange) => exchange.role === 'user',
    );
    expect(userExchange?.content).toBe('What is Rust?');
    expect(userExchange?.requestId).toBe('req-1');
  });

  it('does not duplicate an existing user exchange', () => {
    const conversationStore = useConversationStore();
    const conversation = conversationStore.conversations[0];
    conversationStore.addExchange(conversation.id, {
      role: 'user',
      content: 'already there',
      status: 'done',
      requestId: 'req-1',
      event: 'harness',
    });

    useHarnessEvents().handleHarnessEvent(
      'harness',
      completed({ prompt: 'other', result: 'x' }),
    );

    expect(
      conversation.exchanges.filter((exchange) => exchange.role === 'user'),
    ).toHaveLength(1);
  });

  it('adds original response metadata to the conversation image gallery', () => {
    const conversation = useConversationStore().conversations[0];

    useHarnessEvents().handleHarnessEvent(
      'harness',
      completed({
        template: 'text',
        result: 'done',
        meta: [
          {
            name: 'photo.png',
            hash: 'hash-1',
            size: 12,
            source: 'local',
            variant: 'original',
          },
          {
            name: 'thumb.png',
            hash: 'hash-2',
            source: 'local',
            variant: 'resized',
          },
        ],
      }),
    );

    expect(conversation.uploadedImages).toHaveLength(1);
    expect(conversation.uploadedImages[0]).toMatchObject({
      name: 'photo.png',
      hash: 'hash-1',
      conversationId: conversation.conversationId,
    });
  });

  it('applies the completed response before the terminal persistence command', () => {
    const conversationStore = useConversationStore();
    const patch = vi.spyOn(conversationStore, 'patchAssistantExchange');

    useHarnessEvents().handleHarnessEvent(
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
    const harnessEvents = useHarnessEvents();
    const conversationStore = useConversationStore();

    harnessEvents.handleHarnessEvent('harness', {
      type: 'harness:delta',
      data: {},
    });
    harnessEvents.handleHarnessEvent(
      'harness',
      envelope('harness:unknown', {}),
    );

    expect(conversationStore.conversations[0].exchanges).toHaveLength(0);
  });
});
