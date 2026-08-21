import { describe, expect, it } from 'vitest';

import { buildMemoryMust } from './build-memory-filters.helper.js';

describe('buildMemoryMust', () => {
  it('adds the session scope when provided', () => {
    expect(buildMemoryMust({ sessionId: 'sess-1' })).toEqual([
      { key: 'session_id', match: { value: 'sess-1' } },
    ]);
  });

  it('returns an empty must set without any input (single-user app-wide read)', () => {
    expect(buildMemoryMust({})).toEqual([]);
  });

  it('adds the tightening filters when provided', () => {
    expect(
      buildMemoryMust({
        sessionId: 'sess-1',
        role: 'user',
        conversationId: 'conv-9',
        requestId: 'req-9',
      }),
    ).toEqual([
      { key: 'session_id', match: { value: 'sess-1' } },
      { key: 'role', match: { value: 'user' } },
      { key: 'conversation_id', match: { value: 'conv-9' } },
      { key: 'request_id', match: { value: 'req-9' } },
    ]);
  });

  it('filters tags with a keyword any-match (open payload vocabulary)', () => {
    expect(
      buildMemoryMust({ sessionId: 'sess-1', tags: ['work', 'rust'] }),
    ).toEqual([
      { key: 'session_id', match: { value: 'sess-1' } },
      { key: 'tags', match: { any: ['work', 'rust'] } },
    ]);
  });

  it('adds a full-text containment clause on text', () => {
    expect(
      buildMemoryMust({ sessionId: 'sess-1', contains: 'phone number' }),
    ).toEqual([
      { key: 'session_id', match: { value: 'sess-1' } },
      { key: 'text', match: { text: 'phone number' } },
    ]);
  });

  it('omits empty optional filters', () => {
    expect(
      buildMemoryMust({ sessionId: 'sess-1', tags: [], contains: '' }),
    ).toEqual([{ key: 'session_id', match: { value: 'sess-1' } }]);
  });

  it('tightening filters work without a session scope', () => {
    expect(buildMemoryMust({ tags: ['contacts'] })).toEqual([
      { key: 'tags', match: { any: ['contacts'] } },
    ]);
  });
});
