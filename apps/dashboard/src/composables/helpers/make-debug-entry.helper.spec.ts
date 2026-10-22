import { describe, expect, it } from 'vitest';

import { makeDebugEntry } from './make-debug-entry.helper';

describe('makeDebugEntry', () => {
  it('fills defaults for type and responseTime', () => {
    const entry = makeDebugEntry({
      endpoint: '/',
      method: 'GET',
      status: 'success',
      direction: 'request',
    });
    expect(entry.type).toBe('socket');
    expect(entry.responseTime).toBe(0);
    expect(entry.conversationId).toBeUndefined();
  });

  it('preserves provided conversationId and responseTime', () => {
    const entry = makeDebugEntry({
      endpoint: '/',
      method: 'GET',
      status: 'success',
      conversationId: 's1',
      responseTime: 42,
      direction: 'request',
    });
    expect(entry.conversationId).toBe('s1');
    expect(entry.responseTime).toBe(42);
  });
});
