import { beforeEach, describe, expect, it } from 'vitest';

import { useHarnessResponseStreams } from './use-harness-response-streams';

describe('useHarnessResponseStreams', () => {
  beforeEach(() => {
    useHarnessResponseStreams().resetHarnessResponseStream('req-1');
    useHarnessResponseStreams().resetHarnessResponseStream('req-2');
  });

  it('accumulates events independently by request id', () => {
    const streams = useHarnessResponseStreams();
    streams.processHarnessStreamEvent('req-1', {
      requestId: 'req-1',
      template: 'text',
      delta: 'Hello',
      done: false,
    });
    streams.processHarnessStreamEvent('req-2', {
      requestId: 'req-2',
      template: 'text',
      delta: 'Other',
      done: false,
    });
    const state = streams.processHarnessStreamEvent('req-1', {
      requestId: 'req-1',
      template: 'text',
      delta: ' world',
      done: false,
    });

    expect(state.text).toBe('Hello world');
    expect(state.accumulatedDelta).toBe('Hello world');
  });

  it('starts cleanly after a request reset', () => {
    const streams = useHarnessResponseStreams();
    streams.processHarnessStreamEvent('req-1', {
      requestId: 'req-1',
      template: 'text',
      delta: 'Old response',
      done: false,
    });

    streams.resetHarnessResponseStream('req-1');
    const state = streams.processHarnessStreamEvent('req-1', {
      requestId: 'req-1',
      template: 'text',
      delta: 'Retry response',
      done: false,
    });

    expect(state.text).toBe('Retry response');
    expect(state.accumulatedDelta).toBe('Retry response');
  });
});
