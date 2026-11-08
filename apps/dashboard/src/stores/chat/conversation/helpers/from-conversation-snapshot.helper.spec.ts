import { describe, expect, it } from 'vitest';

import { fromConversationSnapshot } from './from-conversation-snapshot.helper';

describe('fromConversationSnapshot', () => {
  it('prefers the snapshot id and falls back to the conversation id', () => {
    expect(
      fromConversationSnapshot({ id: 's1', conversationId: 'c1' }).id,
    ).toBe('s1');
    expect(fromConversationSnapshot({ conversationId: 'c1' }).id).toBe('c1');
  });

  it('falls back to an untitled title', () => {
    expect(fromConversationSnapshot({ conversationId: 'c1' }).title).toBe(
      '(untitled)',
    );
  });

  it('parses the updated timestamp into epoch millis', () => {
    const stamp = '2024-01-01T00:00:00.000Z';
    expect(
      fromConversationSnapshot({ conversationId: 'c1', updatedAt: stamp })
        .updatedAt,
    ).toBe(new Date(stamp).getTime());
  });

  it('applies safe defaults for content the sidebar does not need yet', () => {
    const result = fromConversationSnapshot({ conversationId: 'c1' });
    expect(result.exchanges).toEqual([]);
    expect(result.uploadedImages).toEqual([]);
    expect(result.model).toBe('');
    expect(result.stream).toBe(true);
    expect(result.type).toBe('temporary');
    expect(result.contextUsagePercent).toBeNull();
    expect(result.loaded).toBe(false);
  });

  it('carries through the persisted metadata fields', () => {
    const result = fromConversationSnapshot({
      conversationId: 'c1',
      numCtx: '8192',
      event: 'chat',
      roomId: 'room-1',
      stream: false,
      type: 'persistent',
      contextUsagePercent: '45%',
    });
    expect(result.numCtx).toBe('8192');
    expect(result.event).toBe('chat');
    expect(result.roomId).toBe('room-1');
    expect(result.stream).toBe(false);
    expect(result.type).toBe('persistent');
    expect(result.contextUsagePercent).toBe('45%');
  });
});
