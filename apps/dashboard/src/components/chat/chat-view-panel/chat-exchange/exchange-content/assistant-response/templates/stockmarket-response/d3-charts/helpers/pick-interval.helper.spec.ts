import { describe, expect, it } from 'vitest';

import { pickInterval } from './pick-interval.helper';
import { DAY_MS, MINUTE_MS, MONTH_MS } from './time-units.constant';

describe('pickInterval', () => {
  it('picks a month step for very long spans', () => {
    expect(pickInterval(1000 * DAY_MS, 500, true)).toEqual({
      stepMs: 3 * MONTH_MS,
      align: 'month',
    });
  });

  it('never falls below a day step without a time component', () => {
    expect(pickInterval(DAY_MS, 1000, false)).toEqual({
      stepMs: DAY_MS,
      align: 'day',
    });
  });

  it('picks minute steps for very short intraday spans', () => {
    expect(pickInterval(MINUTE_MS, 100, true).align).toBe('minute');
  });
});
