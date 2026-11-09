import { describe, expect, it } from 'vitest';

import { parseToastDurationSeconds } from './parse-toast-duration-seconds.helper';

describe('parseToastDurationSeconds', () => {
  it.each([
    ['3', 3],
    ['1e2', 100],
    ['0x11', 17],
  ])('accepts existing numeric-string form %s', (saved, expected) => {
    expect(parseToastDurationSeconds(saved)).toBe(expected);
  });

  it('accepts fractional seconds', () => {
    expect(parseToastDurationSeconds('0.5')).toBeCloseTo(0.5);
  });

  it.each([null, '', ' ', '0', '-1', 'Infinity', 'NaN', 'abc'])(
    'uses the three-second default for invalid value %s',
    (saved) => {
      expect(parseToastDurationSeconds(saved)).toBe(3);
    },
  );
});
