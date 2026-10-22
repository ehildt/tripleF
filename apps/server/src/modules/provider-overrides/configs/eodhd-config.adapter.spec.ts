import { describe, expect, it } from 'vitest';

import {
  EodhdConfigAdapter,
  EodhdConfigSchema,
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

describe('EodhdConfigSchema', () => {
  const validConfig = EodhdConfigAdapter({});

  it('accepts the adapter output', () => {
    expect(EodhdConfigSchema.safeParse(validConfig).success).toBe(true);
  });

  it('rejects a missing endpoint table', () => {
    const withoutFundamentals = { ...validConfig } as Partial<
      typeof validConfig
    >;
    delete withoutFundamentals.fundamentals;
    const result = EodhdConfigSchema.safeParse(withoutFundamentals);
    expect(result.success).toBe(false);
    expect(
      result.error?.issues.some((i) => i.path.includes('fundamentals')),
    ).toBe(true);
  });

  it.each([1, 10, 1000])('accepts endpoint results %s (bounds)', (results) => {
    expect(
      EodhdConfigSchema.safeParse({
        ...validConfig,
        search: { enabled: true, results },
      }).success,
    ).toBe(true);
  });

  it.each([0, 1001, 1.5])(
    'rejects endpoint results %s (out of bounds)',
    (results) => {
      const result = EodhdConfigSchema.safeParse({
        ...validConfig,
        search: { enabled: true, results },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes('results'))).toBe(
        true,
      );
    },
  );

  it('rejects a negative news snippet cap', () => {
    const result = EodhdConfigSchema.safeParse({
      ...validConfig,
      news: { enabled: true, results: 10, snippetChars: -1 },
    });
    expect(result.success).toBe(false);
    expect(
      result.error?.issues.some((i) => i.path.includes('snippetChars')),
    ).toBe(true);
  });
});
