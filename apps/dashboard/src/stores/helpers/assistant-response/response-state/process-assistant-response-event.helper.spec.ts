import { describe, expect, it } from 'vitest';

import type { AssistantStreamEvent } from '@/types/assistant-stream-event.model';

import { createAssistantResponseState } from './create-assistant-response-state.helper';
import { processAssistantResponseEvent } from './process-assistant-response-event.helper';

describe('processAssistantResponseEvent', () => {
  it('accumulates deltas and reveals buffered charts', () => {
    const state = processAssistantResponseEvent(
      createAssistantResponseState('r'),
      {
        delta: 'hello ',
        template: 'text',
      },
    );
    expect(state.accumulatedDelta).toBe('hello ');
    expect(state.revealCharts).toBe(true);
  });

  it('extracts text for the text template', () => {
    const state = processAssistantResponseEvent(
      createAssistantResponseState('r'),
      {
        delta: 'plain answer',
        template: 'text',
      },
    );
    expect(state.text).toBe('plain answer');
  });

  it('normalizes JSON deltas for non-text templates', () => {
    const state = processAssistantResponseEvent(
      createAssistantResponseState('r'),
      {
        delta: '{"title": "A"}',
        template: 'article',
      },
    );
    expect(state.lastValidData?.title).toBe('A');
  });

  it('takes the done event data as authoritative', () => {
    const state = processAssistantResponseEvent(
      createAssistantResponseState('r'),
      {
        template: 'article',
        done: true,
        data: { title: 'Done' },
      },
    );
    expect(state.lastValidData?.title).toBe('Done');
    expect(state.done).toBe(true);
  });

  it('buffers chart data keyed by tool and ticker', () => {
    const state = processAssistantResponseEvent(
      createAssistantResponseState('r'),
      {
        chartData: {
          toolName: 'eodhdHistory',
          data: { ticker: 'AAPL', close: [1] },
        },
      },
    );
    expect(state.chartData['eodhdHistory:AAPL']).toEqual({
      ticker: 'AAPL',
      close: [1],
    });
  });

  it('propagates the latest status', () => {
    const state = processAssistantResponseEvent(
      createAssistantResponseState('r'),
      {
        status: 'streaming',
      } as AssistantStreamEvent,
    );
    expect(state.status).toBe('streaming');
  });
});
