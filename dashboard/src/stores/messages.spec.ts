import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { useConversationStore } from './conversation';
import { useApiMessagesStore } from './messages';
import { useModelsStore } from './models';

vi.mock('../api/conversations.api', () => ({
  fetchConversations: vi.fn().mockResolvedValue([]),
  fetchConversation: vi.fn(),
  saveConversation: vi.fn().mockResolvedValue(undefined),
  deleteConversation: vi.fn().mockResolvedValue(undefined),
}));

describe('useApiMessagesStore', () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    localStorage.clear();
    // The conversation store hydrates persisted conversations asynchronously
    // on creation — settle before seeding a conversation, or the load result
    // would wipe it mid-test.
    useConversationStore();
    await new Promise((resolve) => setTimeout(resolve, 0));
    const conversationStore = useConversationStore();
    conversationStore.createNewConversation('temporary', 'harness', '');
  });

  it('initializes with empty messages', () => {
    const store = useApiMessagesStore();
    expect(store.messages).toEqual([]);
    expect(store.completedCount).toBe(0);
  });

  it('addPendingMessage creates a pending message', () => {
    const store = useApiMessagesStore();
    store.addPendingMessage('harness', 'room-1', 'req-1', true);
    expect(store.messages).toHaveLength(1);
    expect(store.messages[0].data.pending).toBe(true);
    expect(store.messages[0].data.requestId).toBe('req-1');
    expect(store.messages[0].data.event).toBe('harness');
  });

  it('addMessage appends message when tracked', () => {
    const store = useApiMessagesStore();
    store.addPendingMessage('harness', 'room-1', 'req-1');
    store.addMessage('harness', {
      requestId: 'req-1',
      done: true,
      message: { content: 'result' },
    });
    expect(store.messages).toHaveLength(1);
    expect(store.messages[0].data.done).toBe(true);
    expect(store.messages[0].data.message?.content).toBe('result');
  });

  it('addMessage ignores canceled messages', () => {
    const store = useApiMessagesStore();
    store.addMessage('harness', { canceled: true });
    expect(store.messages).toHaveLength(0);
  });

  it('addMessage accepts untracked requestIds', () => {
    const store = useApiMessagesStore();
    store.addMessage('harness', {
      requestId: 'unknown',
      message: { content: 'x' },
    });
    expect(store.messages).toHaveLength(1);
    expect(store.messages[0].data.requestId).toBe('unknown');
  });

  it('removeMessage deletes by requestId', () => {
    const store = useApiMessagesStore();
    store.addPendingMessage('harness', 'room-1', 'req-1');
    store.removeMessage('req-1');
    expect(store.messages).toHaveLength(0);
  });

  it('updatePendingMessage updates existing pending', () => {
    const store = useApiMessagesStore();
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

  it('addMessage handles harness streaming JSON events', () => {
    const store = useApiMessagesStore();
    store.addMessage('harness', {
      requestId: 'req-1',
      template: 'describe',
      delta: '{"title":"Image"',
      done: false,
    });

    const conversationStore = useConversationStore();
    expect(conversationStore.conversations[0].exchanges).toHaveLength(1);
    expect(conversationStore.conversations[0].exchanges[0].role).toBe(
      'assistant',
    );
    expect(
      conversationStore.conversations[0].exchanges[0].harnessTemplate,
    ).toBe('describe');
    expect(
      conversationStore.conversations[0].exchanges[0].harnessData?.title,
    ).toBe('Image');
    expect(conversationStore.conversations[0].exchanges[0].status).toBe(
      'streaming',
    );
  });

  it('addMessage finalizes harness streaming events', () => {
    const store = useApiMessagesStore();
    store.addMessage('harness', {
      requestId: 'req-1',
      template: 'describe',
      delta: '{"title":"Image"',
      done: false,
    });
    store.addMessage('harness', {
      requestId: 'req-1',
      template: 'describe',
      delta: ',"sectionContent":"A scene"}',
      images: [
        {
          imageUrl: 'data:image/png;base64,abc',
          imageAlt: 'photo',
          title: 'photo',
          caption: 'caption',
        },
      ],
      done: true,
    });

    const conversationStore = useConversationStore();
    expect(conversationStore.conversations[0].exchanges[0].status).toBe('done');
    expect(
      conversationStore.conversations[0].exchanges[0].harnessData?.galleryItems,
    ).toHaveLength(1);
    expect(
      conversationStore.conversations[0].exchanges[0].harnessData
        ?.galleryItems?.[0].imageUrl,
    ).toBe('data:image/png;base64,abc');
    expect(
      conversationStore.conversations[0].exchanges[0].harnessData
        ?.sectionContent,
    ).toBe('A scene');
  });

  it('addMessage handles text template harness events', () => {
    const store = useApiMessagesStore();
    store.addMessage('harness', {
      requestId: 'req-1',
      template: 'text',
      delta: 'Hello world',
      done: true,
    });

    const conversationStore = useConversationStore();
    expect(conversationStore.conversations[0].exchanges[0].text).toBe(
      'Hello world',
    );
    expect(conversationStore.conversations[0].exchanges[0].content).toBe(
      'Hello world',
    );
    expect(conversationStore.conversations[0].exchanges[0].status).toBe('done');
  });

  it('backfills numCtx from the model when a response completes with token data', () => {
    const modelsStore = useModelsStore();
    modelsStore.models = [{ model: 'llama3', context_length: 4096 }];
    modelsStore.numCtxOptions = [2048, 4096];

    const conversationStore = useConversationStore();
    conversationStore.conversations[0].model = 'llama3';

    const store = useApiMessagesStore();
    store.addMessage('harness', {
      requestId: 'req-1',
      template: 'text',
      delta: 'Hello world',
      promptEvalCount: 100,
      evalCount: 50,
      done: true,
    });

    expect(conversationStore.conversations[0].numCtx).toBe('4096');
  });

  it('addMessage clears pending on done without content', () => {
    const store = useApiMessagesStore();
    store.addPendingMessage('harness', 'room-1', 'req-1');
    store.addMessage('harness', {
      requestId: 'req-1',
      done: true,
      message: { content: '' },
    });

    expect(store.messages[0].data.pending).toBeUndefined();
    expect(store.messages[0].data.done).toBe(true);
  });

  it('renders error messages for harness stream errors', () => {
    const store = useApiMessagesStore();
    store.addMessage('harness', {
      requestId: 'req-1',
      template: 'text',
      delta: 'Something went wrong',
      error: 'Something went wrong',
      done: true,
    });

    const conversationStore = useConversationStore();
    expect(conversationStore.conversations[0].exchanges[0].content).toContain(
      'Something went wrong',
    );
    expect(conversationStore.conversations[0].exchanges[0].status).toBe('done');
    expect(conversationStore.conversations[0].exchanges[0].content).toContain(
      'Error: Something went wrong',
    );
  });

  it('clearMessages removes everything', () => {
    const store = useApiMessagesStore();
    store.addPendingMessage('harness', 'room-1', 'req-1');
    store.clearMessages();
    expect(store.messages).toHaveLength(0);
    expect(store.completedCount).toBe(0);
  });
});
