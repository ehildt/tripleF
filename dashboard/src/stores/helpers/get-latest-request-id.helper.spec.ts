import { describe, expect, it } from 'vitest';

import type { Exchange } from '../conversation.model';
import { createConversation } from './create-conversation.helper';
import { getLatestRequestId } from './get-latest-request-id.helper';

function makeExchange(requestId?: string): Exchange {
  return {
    id: `ex-${requestId ?? 'x'}`,
    role: 'assistant',
    content: '',
    requestId,
    status: 'done',
    timestamp: 1,
  };
}

describe('getLatestRequestId', () => {
  it('returns the request id of the last exchange that has one', () => {
    const conversation = createConversation();
    conversation.conversationId = 'conv-1';
    conversation.exchanges = [makeExchange('r1'), makeExchange('r2')];

    expect(getLatestRequestId(conversation)).toBe('r2');
  });

  it('skips trailing exchanges without a request id', () => {
    const conversation = createConversation();
    conversation.exchanges = [makeExchange('r1'), makeExchange(undefined)];

    expect(getLatestRequestId(conversation)).toBe('r1');
  });

  it('falls back to the conversation id', () => {
    const conversation = createConversation();
    conversation.conversationId = 'conv-fallback';

    expect(getLatestRequestId(conversation)).toBe('conv-fallback');
  });
});
