import { describe, expect, it } from 'vitest';

import type { HarnessResponseData } from '@/types/harness-response-data.model';

import { buildExchangeMetaPills } from './build-exchange-meta-pills.helper';

describe('buildExchangeMetaPills', () => {
  it('returns an empty list when there is no data', () => {
    expect(buildExchangeMetaPills(undefined)).toEqual([]);
  });

  it('builds the accent category pill first, then date/time/author', () => {
    const data: HarnessResponseData = {
      category: 'Tech',
      publishDate: '2026-08-07',
      readTime: '5 min read',
      author: 'Ada Lovelace',
    };
    expect(buildExchangeMetaPills(data)).toEqual([
      { text: 'Tech', variant: 'accent' },
      { text: '2026-08-07' },
      { text: '5 min read' },
      { text: 'Ada Lovelace' },
    ]);
  });

  it('combines dateline and byline for news responses', () => {
    const data: HarnessResponseData = {
      category: 'World',
      dateline: 'Berlin',
      byline: 'Reuters',
    };
    expect(buildExchangeMetaPills(data)).toEqual([
      { text: 'World', variant: 'accent' },
      { text: 'Berlin · Reuters' },
    ]);
  });

  it('falls back to byline alone when dateline is missing', () => {
    const data: HarnessResponseData = { byline: 'Staff Writer' };
    expect(buildExchangeMetaPills(data)).toEqual([{ text: 'Staff Writer' }]);
  });

  it('omits absent fields', () => {
    const data: HarnessResponseData = { category: 'News' };
    expect(buildExchangeMetaPills(data)).toEqual([
      { text: 'News', variant: 'accent' },
    ]);
  });
});
