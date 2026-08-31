import { describe, expect, it } from 'vitest';

import { mapConversationSnapshot } from './map-conversation-snapshot.helper.js';

describe('mapConversationSnapshot', () => {
  it('projects a latest-turn row into the snapshot shape', () => {
    const updatedAt = new Date('2025-01-01T00:00:00Z');
    expect(
      mapConversationSnapshot({
        conversationId: 'c1',
        title: 'Title',
        updatedAt,
        content: {
          id: 'id-1',
          type: 'persistent',
          event: 'evt',
          roomId: 'room',
          numCtx: '8192',
          stream: true,
          subscriptions: [{ event: 'evt', roomId: 'room' }],
          contextUsagePercent: '50',
        },
      }),
    ).toEqual({
      id: 'id-1',
      conversationId: 'c1',
      title: 'Title',
      updatedAt,
      type: 'persistent',
      event: 'evt',
      roomId: 'room',
      numCtx: '8192',
      stream: true,
      subscriptions: [{ event: 'evt', roomId: 'room' }],
      contextUsagePercent: '50',
    });
  });

  it('falls back to the conversation id and temporary type', () => {
    expect(
      mapConversationSnapshot({ conversationId: 'c1', content: null }),
    ).toMatchObject({
      id: 'c1',
      conversationId: 'c1',
      type: 'temporary',
      contextUsagePercent: null,
    });
  });
});
