import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

import { createEventListener } from './create-event-listener.helper';

describe('createEventListener', () => {
  const socketId = ref<string | null>('session-1');
  const loggedRequestIds = ref(new Set<string>());
  const onMessage = vi.fn();
  const onDebugEntry = vi.fn();

  function listener() {
    return createEventListener('harness', {
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

  it('stamps the payload with the session id and forwards it', () => {
    const data = { requestId: 'r1', roomId: 'room-a' };
    listener()(data);

    expect(data).toHaveProperty('conversationId', 'session-1');
    expect(onMessage).toHaveBeenCalledWith('harness', data);
  });

  it('emits one DATA debug entry per request id', () => {
    const emit = listener();
    emit({ requestId: 'r1', roomId: 'room-a', stream: true });
    emit({ requestId: 'r1', roomId: 'room-a', stream: true });

    const dataEntries = onDebugEntry.mock.calls
      .map(([entry]) => entry)
      .filter((entry) => entry.method === 'DATA');
    expect(dataEntries).toHaveLength(1);
    expect(dataEntries[0]).toMatchObject({
      method: 'DATA',
      requestId: 'r1',
      roomId: 'room-a',
      event: 'harness',
      stream: true,
      conversationId: 'session-1',
    });
  });

  it('emits a DONE entry with normalized token stats', () => {
    listener()({
      requestId: 'r1',
      done: true,
      prompt_eval_count: 120,
      eval_count: 30,
      eval_duration: 5,
      total_duration: 9,
    });

    const doneEntry = onDebugEntry.mock.calls
      .map(([entry]) => entry)
      .find((entry) => entry.method === 'DONE');
    expect(doneEntry).toMatchObject({
      method: 'DONE',
      requestId: 'r1',
      promptEvalCount: 120,
      evalCount: 30,
      evalDuration: 5,
      totalDuration: 9,
    });
  });

  it('falls back to meta[0].requestId when requestId is missing', () => {
    listener()({ meta: [{ requestId: 'nested-1' }] });

    expect(onDebugEntry).toHaveBeenCalledWith(
      expect.objectContaining({ requestId: 'nested-1' }),
    );
  });

  it('skips debug logging when there is no request id at all', () => {
    listener()({ roomId: 'room-a' });

    expect(onMessage).toHaveBeenCalled();
    expect(onDebugEntry).not.toHaveBeenCalled();
  });

  it('omits the conversation id on debug entries when disconnected', () => {
    socketId.value = null;
    listener()({ requestId: 'r1' });

    expect(onDebugEntry).toHaveBeenCalledWith(
      expect.objectContaining({ conversationId: undefined }),
    );
  });
});
