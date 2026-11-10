import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { useConversationStore } from '@/stores/chat/conversation/conversation.store';
import { createConversation } from '@/stores/chat/conversation/helpers/create-conversation.helper';
import type { DlqEntry } from '@/types/dlq-entry.model';

import { useDlqConversationPresence } from './use-dlq-conversation-presence';

function makeEntry(overrides: Partial<DlqEntry> = {}): DlqEntry {
  return {
    id: 'record-1',
    queueName: 'harness',
    jobId: 'job-1',
    jobName: 'request-1',
    status: 'Failed',
    payload: {
      filters: { conversationId: 'conversation-1', event: 'harness' },
    },
    retryConfig: null,
    failedReason: null,
    failedAt: null,
    attemptsMade: 1,
    totalAttempts: 1,
    failureHistory: null,
    nextRetryAt: null,
    createdAt: '',
    ...overrides,
  };
}

describe('useDlqConversationPresence', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('ignores non-harness entries', () => {
    useConversationStore().hydrated = true;
    const { isConversationDeleted } = useDlqConversationPresence();

    expect(isConversationDeleted(makeEntry({ queueName: 'vectorize' }))).toBe(
      false,
    );
  });

  it('reports present before conversations are hydrated', () => {
    const { isConversationDeleted } = useDlqConversationPresence();

    expect(isConversationDeleted(makeEntry())).toBe(false);
  });

  it('reports deleted when the stable conversation id is absent', () => {
    useConversationStore().hydrated = true;
    const { isConversationDeleted } = useDlqConversationPresence();

    expect(isConversationDeleted(makeEntry())).toBe(true);
  });

  it('reports present when the stable conversation id exists', () => {
    const store = useConversationStore();
    store.hydrated = true;
    store.insertConversation(
      createConversation('New chat', { conversationId: 'conversation-1' }),
    );
    const { isConversationDeleted } = useDlqConversationPresence();

    expect(isConversationDeleted(makeEntry())).toBe(false);
  });

  it('propagates invalid harness payloads', () => {
    useConversationStore().hydrated = true;
    const { isConversationDeleted } = useDlqConversationPresence();

    expect(() => isConversationDeleted(makeEntry({ payload: null }))).toThrow(
      'record-1 has no harness filters',
    );
  });
});
