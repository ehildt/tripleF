import { describe, expect, it } from 'vitest';

import { buildSeededExchanges } from './build-seeded-exchanges.helper';

const baseOptions = {
  requestId: 'req-1',
  model: 'model-a',
  event: 'harness',
  roomId: 'room-1',
  conversationId: 'conv-1',
  images: [{ name: 'a.png', hash: 'has-a' }],
};

describe('buildSeededExchanges', () => {
  it('builds the user prompt and the pending assistant placeholder', () => {
    const exchanges = buildSeededExchanges({
      ...baseOptions,
      userContent: 'Summarize this',
    });

    expect(exchanges).toHaveLength(2);
    expect(exchanges[0]).toEqual({
      role: 'user',
      content: 'Summarize this',
      requestId: 'req-1',
      status: 'done',
      model: 'model-a',
      event: 'harness',
      roomId: 'room-1',
      conversationId: 'conv-1',
      images: [{ name: 'a.png', hash: 'has-a' }],
    });
    expect(exchanges[1]).toEqual({
      role: 'assistant',
      content: '',
      requestId: 'req-1',
      status: 'pending',
      model: 'model-a',
      event: 'harness',
      roomId: 'room-1',
      conversationId: 'conv-1',
    });
  });

  it('skips the user exchange when the prompt is empty', () => {
    const exchanges = buildSeededExchanges({ ...baseOptions, userContent: '' });

    expect(exchanges).toHaveLength(1);
    expect(exchanges[0].role).toBe('assistant');
  });
});
