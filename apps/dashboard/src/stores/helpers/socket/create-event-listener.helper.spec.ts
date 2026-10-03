import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

import type { SocketEvent } from '../../../types/socket-event.model';
import { createEventListener } from './create-event-listener.helper';

function makeEnvelope(
  requestId: string,
  overrides: Partial<SocketEvent> & { data?: unknown } = {},
): SocketEvent {
  return {
    v: 1,
    kind: 'event',
    type: 'harness:delta',
    id: `${requestId}-evt`,
    at: new Date().toISOString(),
    meta: { requestId, roomId: 'room-a' },
    data: { channel: 'content', text: 'chunk' },
    ...overrides,
  } as SocketEvent;
}

describe('createEventListener', () => {
  const socketId = ref<string | null>('session-1');
  const loggedRequestIds = ref(new Set<string>());
  const onMessage = vi.fn();
  const onDebugEntry = vi.fn();

  function listener(channelName = 'harness') {
    return createEventListener(channelName, {
      socketId,
      loggedRequestIds,
      onMessage,
      onDebugEntry,
    });
  }

  beforeEach(() => {
    socketId.value = 'session-1';
    loggedRequestIds.value = new Set();
    onMessage.mockClear();
    onDebugEntry.mockClear();
  });

  it('forwards a parsed envelope to the message store', () => {
    const envelope = makeEnvelope('r1');
    listener()(envelope);

    expect(onMessage).toHaveBeenCalledWith('harness', envelope);
  });

  it('forwards non-envelope payloads raw without logging', () => {
    const raw = { requestId: 'legacy-1' };
    listener('foreign-channel')(raw);

    expect(onMessage).toHaveBeenCalledWith('foreign-channel', raw);
    expect(onDebugEntry).not.toHaveBeenCalled();
  });

  it('emits one DATA debug entry per request id', () => {
    const emit = listener();
    emit(makeEnvelope('r1'));
    emit(makeEnvelope('r1'));
    emit(makeEnvelope('r2'));

    const dataEntries = onDebugEntry.mock.calls
      .map(([entry]) => entry)
      .filter((entry) => entry.method === 'DATA');
    expect(dataEntries).toHaveLength(2);
    expect(dataEntries[0]).toMatchObject({
      method: 'DATA',
      requestId: 'r1',
      roomId: 'room-a',
      event: 'harness:delta',
      conversationId: 'session-1',
    });
  });

  it('emits a DONE entry with token stats on the completed envelope', () => {
    listener()(
      makeEnvelope('r1', {
        type: 'harness:completed',
        data: {
          template: 'text',
          result: 'done',
          usage: { promptEvalCount: 120, evalCount: 30 },
        },
      }),
    );

    const doneEntry = onDebugEntry.mock.calls
      .map(([entry]) => entry)
      .find((entry) => entry.method === 'DONE');
    expect(doneEntry).toMatchObject({
      method: 'DONE',
      requestId: 'r1',
      promptEvalCount: 120,
      evalCount: 30,
    });
  });

  it('does not emit a DONE entry for completed envelopes without token stats', () => {
    listener()(
      makeEnvelope('r1', {
        type: 'harness:completed',
        data: { template: 'text', result: 'done' },
      }),
    );

    expect(
      onDebugEntry.mock.calls.map(([entry]) => entry.method),
    ).not.toContain('DONE');
  });

  it('skips debug logging when the envelope carries no request id', () => {
    listener()(makeEnvelope('ignored', { meta: { roomId: 'room-a' } }));

    expect(onMessage).toHaveBeenCalled();
    expect(onDebugEntry).not.toHaveBeenCalled();
  });

  it('omits the conversation id on debug entries when disconnected', () => {
    socketId.value = null;
    listener()(makeEnvelope('r1'));

    expect(onDebugEntry).toHaveBeenCalledWith(
      expect.objectContaining({ conversationId: undefined }),
    );
  });
});
