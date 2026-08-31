import { describe, expect, it } from 'vitest';

import { buildClassifyTranscript } from './classify-transcript.prompt.js';

describe('buildClassifyTranscript', () => {
  it('returns undefined for no messages', () => {
    expect(buildClassifyTranscript([])).toBe(undefined);
  });

  it('builds a transcript with turn numbers', () => {
    const result = buildClassifyTranscript([
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: 'hi' },
    ]);
    expect(result).toContain('[Turn 1 · user] hello');
    expect(result).toContain('[Turn 1 · assistant] hi');
  });

  it('increments the turn on each user message', () => {
    const result = buildClassifyTranscript([
      { role: 'user', content: 'a' },
      { role: 'assistant', content: 'b' },
      { role: 'user', content: 'c' },
    ]);
    expect(result).toContain('[Turn 1 · user] a');
    expect(result).toContain('[Turn 2 · user] c');
  });

  it('skips empty content', () => {
    const result = buildClassifyTranscript([
      { role: 'user', content: '   ' },
      { role: 'user', content: 'hello' },
    ]);
    expect(result).not.toContain('[Turn 1 · user]');
    expect(result).toContain('[Turn 2 · user] hello');
  });
});
