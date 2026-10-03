import { SocketIOService } from '@triplef/socketio';
import { describe, expect, it, vi } from 'vitest';

import { DlqEventsService } from './dlq-events.service.js';

describe('DlqEventsService', () => {
  it('broadcasts a valid dlq:changed envelope', () => {
    const emit = vi.fn();
    const service = new DlqEventsService({
      emit,
    } as unknown as SocketIOService);

    service.broadcastDlqChanged();

    expect(emit).toHaveBeenCalledTimes(1);
    const [topic, envelope] = emit.mock.calls[0];
    expect(topic).toBe('dlq:changed');
    expect(envelope.v).toBe(1);
    expect(envelope.kind).toBe('event');
    expect(envelope.type).toBe('dlq:changed');
    expect(envelope.id).toEqual(expect.any(String));
    expect(envelope.at).toEqual(expect.any(String));
    expect(envelope.data).toEqual({});
  });
});
