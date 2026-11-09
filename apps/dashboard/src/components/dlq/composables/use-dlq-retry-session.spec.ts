import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

import { useConversationStore } from '@/stores/chat/conversation/conversation.store';
import { createConversation } from '@/stores/chat/conversation/helpers/create-conversation.helper';
import type { DlqEntry } from '@/types/dlq-entry.model';

import { useDlqRetrySession } from './use-dlq-retry-session';

const catalog = vi.hoisted(() => ({
  restoreConversation: vi.fn(),
  loadConversationForWrite: vi.fn(),
}));
const exchanges = vi.hoisted(() => ({
  prepareConversationRetry: vi.fn(async () => {}),
}));
const completion = vi.hoisted(() => ({
  markExchangeError: vi.fn(async () => {}),
}));
const socket = vi.hoisted(() => ({
  ensureSocketConnection: vi.fn(),
  listenToEvent: vi.fn(),
  joinRoom: vi.fn(),
}));
const debug = vi.hoisted(() => ({ addDebugResult: vi.fn() }));
const messages = vi.hoisted(() => ({
  resetRequestForRetry: vi.fn(),
  removeMessage: vi.fn(),
}));
const toast = vi.hoisted(() => ({
  debug: vi.fn(),
  error: vi.fn(),
  success: vi.fn(),
  warning: vi.fn(),
}));

vi.mock('@/components/chat/composables/use-conversation-catalog', () => ({
  useConversationCatalog: () => catalog,
}));
vi.mock('@/components/chat/composables/use-conversation-turns', () => ({
  useConversationTurns: () => exchanges,
}));
vi.mock(
  '@/components/chat/composables/use-conversation-exchange-completion',
  () => ({ useConversationExchangeCompletion: () => completion }),
);
vi.mock('@/composables/use-socket/use-socket', () => ({
  useSocket: () => ({
    connectedEvents: ref(new Set<string>()),
    connectedRooms: ref(new Map<string, Set<string>>()),
    ensureSocketConnection: socket.ensureSocketConnection,
    listenToEvent: socket.listenToEvent,
    joinRoom: socket.joinRoom,
  }),
}));
vi.mock('@/stores/debug/debug.store', () => ({
  useDebugStore: () => debug,
}));
vi.mock('@/stores/messages/messages.store', () => ({
  useMessagesStore: () => messages,
}));
vi.mock('@/composables/use-toast/use-toast', () => ({ useToast: () => toast }));
vi.mock('@/i18n/i18n', () => ({
  i18n: { global: { t: (key: string) => key } },
}));

function makeEntry(overrides: Partial<DlqEntry> = {}): DlqEntry {
  return {
    id: 'record-1',
    queueName: 'harness',
    jobId: 'job-1',
    jobName: 'request-1',
    status: 'Failed',
    payload: {
      filters: {
        conversationId: 'conversation-1',
        event: 'harness',
        roomId: 'room-1',
        model: 'llama3',
        numCtx: '4096',
        think: 'medium',
        stream: true,
        prompt: JSON.stringify([{ role: 'user', content: 'Retry me' }]),
      },
    },
    retryConfig: null,
    failedReason: 'failed',
    failedAt: null,
    attemptsMade: 1,
    totalAttempts: 1,
    failureHistory: null,
    nextRetryAt: null,
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('useDlqRetrySession', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('prepares an existing conversation and registers pending state before requeue', async () => {
    const conversation = createConversation('Chat', {
      conversationId: 'conversation-1',
    });
    useConversationStore().insertConversation(conversation);
    catalog.loadConversationForWrite.mockResolvedValue(conversation);

    const session = await useDlqRetrySession().prepareRetrySession(makeEntry());

    expect(exchanges.prepareConversationRetry).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationStoreId: conversation.id,
        requestId: 'request-1',
        serverConversationId: 'conversation-1',
        failedPrompt: 'Retry me',
      }),
    );
    expect(socket.ensureSocketConnection).toHaveBeenCalled();
    expect(socket.listenToEvent).toHaveBeenCalledWith('harness');
    expect(socket.joinRoom).toHaveBeenCalledWith('room-1', 'harness');
    expect(messages.resetRequestForRetry).toHaveBeenCalledWith(
      'harness',
      'room-1',
      'request-1',
      true,
    );
    expect(session).toEqual({
      conversationStoreId: conversation.id,
      requestId: 'request-1',
      event: 'harness',
      roomId: 'room-1',
      stream: true,
    });
  });

  it('recovers a missing conversation before preparing retry', async () => {
    const recovered = createConversation('Recovered', {
      conversationId: 'conversation-1',
    });
    catalog.restoreConversation.mockReturnValue(recovered);

    const session = await useDlqRetrySession().prepareRetrySession(makeEntry());

    expect(catalog.restoreConversation).toHaveBeenCalledOnce();
    expect(exchanges.prepareConversationRetry).toHaveBeenCalledWith(
      expect.objectContaining({ conversationStoreId: recovered.id }),
    );
    expect(session.conversationStoreId).toBe(recovered.id);
  });

  it('does not seed a duplicate prompt for an existing failed turn', async () => {
    const conversation = createConversation('Chat', {
      conversationId: 'conversation-1',
    });
    useConversationStore().insertConversation(conversation);
    useConversationStore().addExchange(
      conversation.id,
      {
        role: 'user',
        content: 'Existing prompt',
        requestId: 'request-1',
        status: 'done',
      },
      'New chat',
    );
    catalog.loadConversationForWrite.mockResolvedValue(conversation);

    await useDlqRetrySession().prepareRetrySession(makeEntry());

    const preparation = exchanges.prepareConversationRetry.mock.calls[0][0];
    expect(preparation).not.toHaveProperty('failedPrompt');
  });

  it('records successful completion', () => {
    useDlqRetrySession().completeRetrySession({
      conversationStoreId: 'c1',
      requestId: 'request-1',
      event: 'harness',
      roomId: 'room-1',
      stream: true,
    });

    expect(debug.addDebugResult).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'RETRY',
        status: 'success',
        requestId: 'request-1',
      }),
    );
  });

  it('clears pending state and marks the exchange failed on retry failure', () => {
    useDlqRetrySession().failRetrySession({
      conversationStoreId: 'c1',
      requestId: 'request-1',
      event: 'harness',
      roomId: 'room-1',
      stream: true,
    });

    expect(messages.removeMessage).toHaveBeenCalledWith('request-1');
    expect(completion.markExchangeError).toHaveBeenCalledWith(
      'c1',
      'request-1',
      'toast.retryFailed',
    );
  });
});
