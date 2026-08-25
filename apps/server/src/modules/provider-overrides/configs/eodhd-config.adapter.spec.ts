import { describe, expect, it } from 'vitest';

import {
  EodhdConfigAdapter,
  type EodhdNewsConfig,
} from './eodhd-config.adapter.js';

describe('EodhdConfigAdapter', () => {
  it('returns the default config when env is empty', () => {
    const config = EodhdConfigAdapter({});
    expect(config.enabled).toBe(false);
    expect(config.news.results).toBe(10);
    expect(config.news.snippetChars).toBe(0);
  });

  it('reads the news endpoint knobs from env', () => {
    const config = EodhdConfigAdapter({
      EODHD_NEWS_ENABLED: 'true',
      EODHD_NEWS_RESULTS: '5',
      EODHD_NEWS_SNIPPET_CHARS: '200',
    });
    const news: EodhdNewsConfig = config.news;
    expect(news.enabled).toBe(true);
    expect(news.results).toBe(5);
    expect(news.snippetChars).toBe(200);
  });
});
