import { describe, expect, it } from 'vitest';

import type { DlqEntry } from '@/types/dlq-entry.model';

import { buildRecoveredConversation } from './build-recovered-conversation.helper';

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
        prompt: [{ role: 'user', content: 'Hi' }],
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

describe('buildRecoveredConversation', () => {
  it('restores the conversation identity and original settings', () => {
    const recovered = buildRecoveredConversation(
      makeEntry({
        payload: {
          filters: {
            conversationId: 'conversation-1',
            event: 'harness',
            roomId: 'room-1',
            model: 'llama3',
            numCtx: '4096',
            think: 'high',
            stream: false,
            prompt: [{ role: 'user', content: 'Hi' }],
          },
        },
      }),
    );

    expect(recovered.conversationId).toBe('conversation-1');
    expect(recovered.type).toBe('temporary');
    expect(recovered.event).toBe('harness');
    expect(recovered.roomId).toBe('room-1');
    expect(recovered.model).toBe('llama3');
    expect(recovered.numCtx).toBe('4096');
    expect(recovered.think).toBe('high');
    expect(recovered.stream).toBe(false);
    expect(recovered.subscriptions).toEqual([
      { event: 'harness', roomId: 'room-1' },
    ]);
  });

  it('restores prompt history in order and tags only the failed turn', () => {
    const recovered = buildRecoveredConversation(
      makeEntry({
        payload: {
          filters: {
            conversationId: 'conversation-1',
            event: 'harness',
            prompt: [
              { role: 'assistant', content: 'previous answer' },
              { role: 'user', content: 'Retry me' },
            ],
          },
        },
      }),
    );

    expect(recovered.exchanges).toHaveLength(2);
    const [assistant, user] = recovered.exchanges;
    expect(assistant).toMatchObject({
      role: 'assistant',
      content: 'previous answer',
      status: 'done',
    });
    expect(assistant.requestId).toBeUndefined();
    expect(user).toMatchObject({
      role: 'user',
      content: 'Retry me',
      status: 'done',
    });
    expect(user.requestId).toBe('request-1');
    expect(user.id).not.toBe(assistant.id);
    expect(user.timestamp).toBeGreaterThan(assistant.timestamp);
  });

  it('infers the title from the first user prompt', () => {
    const recovered = buildRecoveredConversation(
      makeEntry({
        payload: {
          filters: {
            conversationId: 'conversation-1',
            event: 'harness',
            prompt: [{ role: 'user', content: 'Title from prompt' }],
          },
        },
      }),
    );

    expect(recovered.title).toBe('Title from prompt');
  });

  it('applies conversation defaults for omitted settings', () => {
    const recovered = buildRecoveredConversation(makeEntry());

    expect(recovered.numCtx).toBe('');
    expect(recovered.think).toBe('medium');
    expect(recovered.stream).toBe(true);
  });

  it('rejects a payload without a user prompt', () => {
    const entry = makeEntry({
      payload: {
        filters: {
          conversationId: 'conversation-1',
          event: 'harness',
          prompt: [{ role: 'assistant', content: 'no user turn' }],
        },
      },
    });

    expect(() => buildRecoveredConversation(entry)).toThrow(
      'has no user prompt to recover',
    );
  });
});
