import { describe, expect, it } from 'vitest';

import type { MessageData } from '../../../types/message-data.model';
import { isErrorStreamEvent } from './is-error-stream-event.helper';

describe('isErrorStreamEvent', () => {
  it('is true only for a done event carrying an error', () => {
    expect(
      isErrorStreamEvent({ error: 'boom', done: true } as MessageData),
    ).toBe(true);
  });

  it('is false for in-flight errors or successful completions', () => {
    expect(isErrorStreamEvent({ error: 'boom' } as MessageData)).toBe(false);
    expect(isErrorStreamEvent({ done: true } as MessageData)).toBe(false);
  });
});
