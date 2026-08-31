import { describe, expect, it } from 'vitest';

import { mapMemoryPointToUpsert } from './map-memory-point-to-upsert.helper.js';

describe('mapMemoryPointToUpsert', () => {
  it('builds a Qdrant upsert point from a memory point', () => {
    const input = {
      memoryPartition: 'p1',
      role: 'user' as const,
      sessionId: 's1',
      conversationId: 'c1',
      requestId: 'r1',
      files: [{ name: 'f.png', url: 'https://example.com/f.png' }],
      points: [],
    };
    expect(
      mapMemoryPointToUpsert(
        {
          id: 'id1',
          vector: [1, 2, 3],
          text: 'hello',
          tags: ['a'],
          category: 'Games',
          path: 'likes.games',
        },
        input,
        '2025-01-01T00:00:00Z',
      ),
    ).toEqual({
      id: 'id1',
      vector: [1, 2, 3],
      payload: {
        memory_partition: 'p1',
        memory_cognition: undefined,
        session_id: 's1',
        role: 'user',
        conversation_id: 'c1',
        request_id: 'r1',
        text: 'hello',
        tags: ['a'],
        category: 'games',
        path: 'likes.games',
        files: [{ name: 'f.png', url: 'https://example.com/f.png' }],
        created_at: '2025-01-01T00:00:00Z',
      },
    });
  });
});
