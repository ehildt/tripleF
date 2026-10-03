import { describe, expect, it } from 'vitest';

import { buildSocketEvent } from './build-socket-event.helper.js';

describe('buildSocketEvent', () => {
  it('builds an event envelope with a generated id and timestamp', () => {
    const envelope = buildSocketEvent('dlq:changed', {});

    expect(envelope.v).toBe(1);
    expect(envelope.kind).toBe('event');
    expect(envelope.type).toBe('dlq:changed');
    expect(envelope.data).toEqual({});
    expect(envelope.id).toEqual(expect.any(String));
    expect(envelope.id).not.toBe('');
    expect(envelope.at).toEqual(expect.any(String));
    expect(envelope.at).not.toBe('');
  });

  it('is deterministic when id and at are provided', () => {
    const envelope = buildSocketEvent(
      'harness:completed',
      { ok: true },
      {
        id: 'event-1',
        at: '2026-01-15T09:30:00.000Z',
      },
    );

    expect(envelope).toEqual({
      v: 1,
      kind: 'event',
      type: 'harness:completed',
      id: 'event-1',
      at: '2026-01-15T09:30:00.000Z',
      data: { ok: true },
    });
  });

  it('honors an explicit kind and correlation meta', () => {
    const envelope = buildSocketEvent(
      'harness:cancelled',
      { success: true },
      {
        kind: 'reply',
        meta: { requestId: 'r1', roomId: 'room-1' },
      },
    );

    expect(envelope.kind).toBe('reply');
    expect(envelope.meta).toEqual({ requestId: 'r1', roomId: 'room-1' });
  });

  it('omits the meta key when no correlation ids are provided', () => {
    const envelope = buildSocketEvent('dlq:changed', {});
    expect(envelope).not.toHaveProperty('meta');
  });
});
