import { describe, expect, it } from 'vitest';

import { createHarnessResponseState } from './create-harness-response-state.helper';

describe('createHarnessResponseState', () => {
  it('creates an empty state for the request', () => {
    const state = createHarnessResponseState('req-1');

    expect(state.requestId).toBe('req-1');
    expect(state.accumulatedDelta).toBe('');
    expect(state.lastValidData).toBeNull();
    expect(state.template).toBeNull();
    expect(state.text).toBe('');
    expect(state.done).toBe(false);
  });
});
