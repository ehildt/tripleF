import { describe, expect, it } from 'vitest';

import { buildChartDataKey } from './build-chart-data-key.helper';

describe('buildChartDataKey', () => {
  it('returns the tool name alone for non-object data', () => {
    expect(buildChartDataKey('eodhdHistory', undefined)).toBe('eodhdHistory');
    expect(buildChartDataKey('eodhdHistory', 'x')).toBe('eodhdHistory');
  });

  it('appends a ticker when present', () => {
    expect(buildChartDataKey('eodhdHistory', { ticker: 'AAPL' })).toBe(
      'eodhdHistory:AAPL',
    );
  });

  it('appends the function when present', () => {
    expect(
      buildChartDataKey('eodhdTechnical', {
        ticker: 'AAPL',
        function: 'rsi',
      }),
    ).toBe('eodhdTechnical:AAPL:rsi');
  });
});
