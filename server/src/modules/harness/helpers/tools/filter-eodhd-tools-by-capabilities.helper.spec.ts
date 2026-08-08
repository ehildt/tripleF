import { describe, expect, it } from 'vitest';

import { filterEodhdToolsByCapabilities } from './filter-eodhd-tools-by-capabilities.helper.js';

describe('filterEodhdToolsByCapabilities', () => {
  it('returns tool names unchanged when there are no capabilities', () => {
    const tools = ['eodhdQuote', 'webSearch'];
    expect(filterEodhdToolsByCapabilities(tools)).toEqual(tools);
  });

  it('drops tools whose endpoint is disabled', () => {
    const tools = ['eodhdQuote', 'eodhdHistory', 'webSearch'];
    const result = filterEodhdToolsByCapabilities(tools, {
      endpoints: { quote: false, history: true },
    } as never);
    expect(result).toEqual(['eodhdHistory', 'webSearch']);
  });

  it('keeps non-eodhd tools', () => {
    const tools = ['webSearch', 'eodhdQuote'];
    const result = filterEodhdToolsByCapabilities(tools, {
      endpoints: { quote: false },
    } as never);
    expect(result).toEqual(['webSearch']);
  });
});
