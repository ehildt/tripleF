import { describe, expect, it } from 'vitest';

import { buildChartDataKey } from './build-chart-data-key.helper';

describe('buildChartDataKey', () => {
  it('falls back to the tool name without a ticker', () => {
    expect(buildChartDataKey('eodhdHistory', undefined)).toBe('eodhdHistory');
    expect(buildChartDataKey('eodhdHistory', {})).toBe('eodhdHistory');
    expect(buildChartDataKey('eodhdHistory', 'oops')).toBe('eodhdHistory');
  });

  it('keys by ticker when present', () => {
    expect(
      buildChartDataKey('eodhdHistory', { ticker: 'NVDA.US', history: [] }),
    ).toBe('eodhdHistory:NVDA.US');
  });

  it('keys technical series by ticker and function so they coexist', () => {
    expect(
      buildChartDataKey('eodhdTechnical', {
        ticker: 'NVDA.US',
        function: 'rsi',
      }),
    ).toBe('eodhdTechnical:NVDA.US:rsi');
    expect(
      buildChartDataKey('eodhdTechnical', {
        ticker: 'NVDA.US',
        function: 'macd',
      }),
    ).toBe('eodhdTechnical:NVDA.US:macd');
  });
});
