import { describe, expect, it } from 'vitest';

import { createAssistantResponseState } from './create-assistant-response-state.helper';

describe('createAssistantResponseState', () => {
  it('initializes the streaming state', () => {
    const state = createAssistantResponseState('req-1');
    expect(state.requestId).toBe('req-1');
    expect(state.accumulatedDelta).toBe('');
    expect(state.lastValidData).toBeNull();
    expect(state.template).toBeNull();
    expect(state.text).toBe('');
    expect(state.status).toBeNull();
    expect(state.done).toBe(false);
    expect(state.chartData).toEqual({});
    expect(state.revealCharts).toBe(false);
  });
});
