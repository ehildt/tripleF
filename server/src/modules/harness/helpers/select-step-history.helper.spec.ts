import { describe, expect, it } from 'vitest';

import { selectStepHistory } from './select-step-history.helper.js';

const user = (i: number) => ({ role: 'user' as const, content: `u${i}` });
const assistant = (i: number) => ({
  role: 'assistant' as const,
  content: `a${i}`,
});

describe('selectStepHistory', () => {
  it('returns full history for short conversations', () => {
    const messages = [user(1), assistant(1)];
    expect(selectStepHistory({ messages })).toEqual({
      messages,
      mode: 'full',
    });
  });

  it('returns full history for recap templates', () => {
    const messages = Array.from({ length: 10 }, (_, i) => user(i));
    const result = selectStepHistory({ messages, template: 'summary' });
    expect(result.mode).toBe('full');
  });

  it('returns the latest user message for long conversations', () => {
    const messages = Array.from({ length: 10 }, (_, i) => user(i));
    const result = selectStepHistory({ messages, template: 'product' });
    expect(result.mode).toBe('derived');
    expect(result.messages).toEqual([user(9)]);
  });

  it('returns the last exchange for the text template', () => {
    const messages = [
      ...Array.from({ length: 8 }, (_, i) => user(i)),
      assistant(8),
      user(9),
    ];
    const result = selectStepHistory({ messages, template: 'text' });
    expect(result.mode).toBe('derived');
    expect(result.messages).toEqual([assistant(8), user(9)]);
  });

  it('returns empty derived history when there is no user message', () => {
    const messages = Array.from({ length: 8 }, (_, i) => assistant(i));
    const result = selectStepHistory({ messages, template: 'product' });
    expect(result).toEqual({ messages: [], mode: 'derived' });
  });
});
