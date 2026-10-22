import { describe, expect, it } from 'vitest';

import {
  SerperConfigAdapter,
  SerperConfigSchema,
} from './serper-config.adapter.js';

describe('SerperConfigSchema', () => {
  const validConfig = SerperConfigAdapter({});

  it('accepts the adapter output', () => {
    expect(SerperConfigSchema.safeParse(validConfig).success).toBe(true);
  });

  it('accepts an optional apiKey when present', () => {
    expect(
      SerperConfigSchema.safeParse({ ...validConfig, apiKey: 'key' }).success,
    ).toBe(true);
  });

  it('rejects a missing endpoint table', () => {
    const withoutReviews = { ...validConfig } as Partial<typeof validConfig>;
    delete withoutReviews.reviews;
    const result = SerperConfigSchema.safeParse(withoutReviews);
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes('reviews'))).toBe(
      true,
    );
  });

  it('rejects an endpoint without enabled', () => {
    const result = SerperConfigSchema.safeParse({
      ...validConfig,
      web: { results: 10 },
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes('enabled'))).toBe(
      true,
    );
  });

  it.each([1, 2, 3])(
    'accepts ranked endpoint results %s (bounds)',
    (results) => {
      expect(
        SerperConfigSchema.safeParse({
          ...validConfig,
          news: { enabled: true, results },
        }).success,
      ).toBe(true);
    },
  );

  it.each([0, 4, 1.5])(
    'rejects ranked endpoint results %s (out of bounds)',
    (results) => {
      const result = SerperConfigSchema.safeParse({
        ...validConfig,
        news: { enabled: true, results },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes('results'))).toBe(
        true,
      );
    },
  );

  it.each([1, 10, 200])(
    'accepts media endpoint results %s (bounds)',
    (results) => {
      expect(
        SerperConfigSchema.safeParse({
          ...validConfig,
          images: { enabled: true, results },
        }).success,
      ).toBe(true);
    },
  );

  it.each([0, 201, 1.5])(
    'rejects media endpoint results %s (out of bounds)',
    (results) => {
      const result = SerperConfigSchema.safeParse({
        ...validConfig,
        images: { enabled: true, results },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes('results'))).toBe(
        true,
      );
    },
  );

  it('rejects a missing scrape table', () => {
    const withoutScrape = { ...validConfig } as Partial<typeof validConfig>;
    delete withoutScrape.scrape;
    const result = SerperConfigSchema.safeParse(withoutScrape);
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes('scrape'))).toBe(
      true,
    );
  });
});
