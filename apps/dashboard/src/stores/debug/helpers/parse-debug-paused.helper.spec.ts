import { describe, expect, it } from 'vitest';

import { parseDebugPaused } from './parse-debug-paused.helper';

describe('parseDebugPaused', () => {
  it('pauses by default and resumes only for an explicit false value', () => {
    expect(parseDebugPaused(null)).toBe(true);
    expect(parseDebugPaused('true')).toBe(true);
    expect(parseDebugPaused('invalid')).toBe(true);
    expect(parseDebugPaused('false')).toBe(false);
  });
});
