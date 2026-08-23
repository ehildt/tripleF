import { describe, expect, it } from 'vitest';

import { extractEodhdTickerFromResults } from './extract-eodhd-ticker.helper.js';

describe('extractEodhdTickerFromResults', () => {
  it('extracts the first ticker from an eodhdSearch result', () => {
    const toolResults = [
      { toolName: 'eodhdSearch', result: { results: [{ code: 'AAPL' }] } },
    ];
    expect(extractEodhdTickerFromResults(toolResults as never)).toBe('AAPL');
  });

  it('returns undefined when no eodhdSearch result has a code', () => {
    const toolResults = [
      { toolName: 'eodhdSearch', result: { results: [{ name: 'Apple' }] } },
    ];
    expect(extractEodhdTickerFromResults(toolResults as never)).toBe(undefined);
  });

  it('ignores non-eodhdSearch results', () => {
    const toolResults = [
      { toolName: 'webSearch', result: { results: [] } },
      { toolName: 'eodhdSearch', result: { results: [{ code: 'MSFT' }] } },
    ];
    expect(extractEodhdTickerFromResults(toolResults as never)).toBe('MSFT');
  });

  it('returns undefined for no results', () => {
    expect(extractEodhdTickerFromResults([])).toBe(undefined);
  });
});
