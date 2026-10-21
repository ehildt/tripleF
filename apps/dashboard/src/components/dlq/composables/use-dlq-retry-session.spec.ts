import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { DlqEntry } from '@/types/dlq-entry.model';

import { useConversationStore } from '../../../stores/conversation';
import { useDebugStore } from '../../../stores/debug';
import { useApiMessagesStore } from '../../../stores/messages';
import { inMemoryTemporaryConversationsTable } from '../../../test-utils/in-memory-temporary-conversations';
import { useDlqRetrySession } from './use-dlq-retry-session';

// The socket store is module-mocked: the real one would open a live
// connection; the retry-session tests assert the subscription contract only.
const socketStoreMock = vi.hoisted(() => ({
  ensureSocketConnection: vi.fn(),
  listenToEvent: vi.fn(),
  joinRoom: vi.fn(),
  connectedEvents: new Set<string>(),
  connectedRooms: new Map<string, Set<string>>(),
}));

vi.mock('../../../stores/socket', () => ({
  useSocketStore: () => socketStoreMock,
}));

// Conversation-store persistence layers, as in stores/conversation.spec.ts.
vi.mock('../../../api/conversations.api', () => ({
  fetchConversations: vi.fn().mockResolvedValue([]),
  fetchConversation: vi.fn(),
  saveConversation: vi.fn().mockResolvedValue(undefined),
  deleteConversation: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../../api/storage.api', () => ({
  deleteUploadedObject: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../../stores/attached-files', () => ({
  useAttachedFilesStore: () => ({ clearPendingFilesForConversation: vi.fn() }),
}));

const makeEntry = (overrides: Partial<DlqEntry> = {}): DlqEntry =>
  ({
    id: 'rec-1',
    queueName: 'harness',
    jobName: 'req-1',
    status: 'Failed',
    payload: null,
    failedReason: null,
    failedAt: null,
    attemptsMade: 0,
    totalAttempts: 3,
    nextRetryAt: null,
    createdAt: '',
    ...overrides,
  }) as DlqEntry;

describe('useDlqRetrySession', () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    localStorage.clear();
    // Debug logging is paused unless explicitly unpaused in localStorage.
    localStorage.setItem('debug-paused', 'false');
    inMemoryTemporaryConversationsTable.clear();
    vi.clearAllMocks();
    socketStoreMock.connectedEvents = new Set();
    socketStoreMock.connectedRooms = new Map();
    // Hydrate the conversation store before seeding — the async load would
    // otherwise wipe conversations created mid-test.
    useConversationStore();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  it('subscribes to the event and room when not yet connected', () => {
    const { ensureSocketSubscription } = useDlqRetrySession();

    ensureSocketSubscription('room1', 'harness');

    expect(socketStoreMock.ensureSocketConnection).toHaveBeenCalledOnce();
    expect(socketStoreMock.listenToEvent).toHaveBeenCalledWith('harness');
    expect(socketStoreMock.joinRoom).toHaveBeenCalledWith('room1', 'harness');
  });

  it('skips subscribing when event and room are already connected', () => {
    socketStoreMock.connectedEvents = new Set(['harness']);
    socketStoreMock.connectedRooms = new Map([['harness', new Set(['room1'])]]);
    const { ensureSocketSubscription } = useDlqRetrySession();

    ensureSocketSubscription('room1', 'harness');

    expect(socketStoreMock.listenToEvent).not.toHaveBeenCalled();
    expect(socketStoreMock.joinRoom).not.toHaveBeenCalled();
  });

  it('logs the retry and tracks a pending message once per request id', () => {
    const debugStore = useDebugStore();
    const messagesStore = useApiMessagesStore();
    const { addRetryPendingMessage } = useDlqRetrySession();

    addRetryPendingMessage('req-1', 'room1', 'harness', 'llama3');
    addRetryPendingMessage('req-1', 'room1', 'harness', 'llama3');

    expect(debugStore.debugResults[0]?.endpoint).toBe('/api/v1/dlq/reinstate');
    const pending = messagesStore.messages.filter(
      (m) => m.data.requestId === 'req-1',
    );
    expect(pending).toHaveLength(1);
    expect(pending[0].data.pending).toBe(true);
  });

  it('seeds the active conversation with the prompt and a pending answer', () => {
    const conversationStore = useConversationStore();
    const conversation = conversationStore.ensureConversation();
    const entry = makeEntry({
      payload: {
        filters: { prompt: [{ role: 'user', content: 'hello' }] },
      },
    });
    const { addRetryPendingMessage } = useDlqRetrySession();

    addRetryPendingMessage('req-1', 'room1', 'harness', 'llama3', entry);

    const stored = conversationStore.getConversation(conversation.id)!;
    expect(stored.event).toBe('harness');
    expect(stored.roomId).toBe('room1');
    const exchangesByRole = (role: string) =>
      stored.exchanges.filter(
        (exchange) => exchange.requestId === 'req-1' && exchange.role === role,
      );
    expect(exchangesByRole('user')).toHaveLength(1);
    expect(exchangesByRole('user')[0].content).toBe('hello');
    expect(exchangesByRole('assistant')).toHaveLength(1);
    expect(exchangesByRole('assistant')[0].status).toBe('pending');
  });

  it('does not duplicate exchanges when the request is already seeded', () => {
    const conversationStore = useConversationStore();
    const conversation = conversationStore.ensureConversation();
    const entry = makeEntry({
      payload: {
        filters: { prompt: [{ role: 'user', content: 'hello' }] },
      },
    });
    const { addRetryPendingMessage } = useDlqRetrySession();

    addRetryPendingMessage('req-1', 'room1', 'harness', 'llama3', entry);
    addRetryPendingMessage('req-1', 'room1', 'harness', 'llama3', entry);

    const stored = conversationStore.getConversation(conversation.id)!;
    expect(
      stored.exchanges.filter((exchange) => exchange.requestId === 'req-1'),
    ).toHaveLength(2);
  });
});
