import { describe, expect, it } from 'vitest';

import { parseShowCounters } from './parse-show-counters.helper';

describe('parseShowCounters', () => {
  it('enables only an explicit true value', () => {
    expect(parseShowCounters('true')).toBe(true);
    expect(parseShowCounters('false')).toBe(false);
    expect(parseShowCounters(null)).toBe(false);
    expect(parseShowCounters('invalid')).toBe(false);
  });
});
