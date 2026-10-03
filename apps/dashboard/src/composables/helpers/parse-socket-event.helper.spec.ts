import { describe, expect, it } from 'vitest';

import { parseSocketEvent } from './parse-socket-event.helper';

const baseEvent = {
  v: 1,
  kind: 'event',
  type: 'dlq:changed',
  id: 'event-1',
  at: '2026-01-15T09:30:00.000Z',
  data: {},
} as const;

describe('parseSocketEvent', () => {
  it('returns the parsed envelope for a valid event', () => {
    expect(parseSocketEvent(baseEvent)).toEqual(baseEvent);
  });

  it('parses a reply envelope with correlation meta', () => {
    const payload = {
      v: 1,
      kind: 'reply',
      type: 'harness:cancelled',
      id: 'event-2',
      at: '2026-01-15T09:30:00.000Z',
      meta: { requestId: 'r1', roomId: 'room-1', sessionId: 's1' },
      data: { requestId: 'r1', success: true },
    };
    expect(parseSocketEvent(payload)).toEqual(payload);
  });

  it('returns null when a required root field is missing', () => {
    const payload = {
      kind: 'event',
      type: 'dlq:changed',
      id: 'event-1',
      at: '2026-01-15T09:30:00.000Z',
      data: {},
    };
    expect(parseSocketEvent(payload)).toBeNull();
  });

  it('returns null for an unknown kind', () => {
    expect(parseSocketEvent({ ...baseEvent, kind: 'banana' })).toBeNull();
  });

  it('returns null for a wrong protocol version', () => {
    expect(parseSocketEvent({ ...baseEvent, v: 2 })).toBeNull();
  });

  it('rejects domain fields that leak to the root', () => {
    expect(parseSocketEvent({ ...baseEvent, requestId: 'leak' })).toBeNull();
  });

  it('returns null for non-object payloads', () => {
    expect(parseSocketEvent(null)).toBeNull();
    expect(parseSocketEvent('not-an-event')).toBeNull();
    expect(parseSocketEvent(42)).toBeNull();
  });

  it('accepts arbitrary data shapes', () => {
    expect(parseSocketEvent({ ...baseEvent, data: null })).not.toBeNull();
    expect(parseSocketEvent({ ...baseEvent, data: [1, 2, 3] })).not.toBeNull();
    expect(parseSocketEvent({ ...baseEvent, data: 'text' })).not.toBeNull();
  });
});
