import { describe, expect, it } from 'vitest';

import { isMajor } from './is-major.helper';

describe('isMajor', () => {
  it('treats month, week, and hour as major', () => {
    expect(isMajor('month')).toBe(true);
    expect(isMajor('week')).toBe(true);
    expect(isMajor('hour')).toBe(true);
  });

  it('treats day and minute as minor', () => {
    expect(isMajor('day')).toBe(false);
    expect(isMajor('minute')).toBe(false);
  });
});
