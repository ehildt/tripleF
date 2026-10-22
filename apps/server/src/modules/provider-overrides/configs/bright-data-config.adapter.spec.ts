import { describe, expect, it } from 'vitest';

import {
  BrightDataConfigAdapter,
  BrightDataConfigSchema,
} from './bright-data-config.adapter.js';

describe('BrightDataConfigSchema', () => {
  const validConfig = BrightDataConfigAdapter({});

  it('accepts the adapter output', () => {
    expect(BrightDataConfigSchema.safeParse(validConfig).success).toBe(true);
  });

  it('accepts optional apiKey and zones when present', () => {
    const result = BrightDataConfigSchema.safeParse({
      ...validConfig,
      apiKey: 'key',
      serpZone: 'zone',
      unlockerZone: 'zone2',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a missing endpoint table', () => {
    const withoutTable = { ...validConfig } as Partial<typeof validConfig>;
    delete withoutTable.web;
    const result = BrightDataConfigSchema.safeParse(withoutTable);
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes('web'))).toBe(true);
  });

  it('rejects an endpoint without enabled', () => {
    const result = BrightDataConfigSchema.safeParse({
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
      const result = BrightDataConfigSchema.safeParse({
        ...validConfig,
        web: { enabled: true, results },
      });
      expect(result.success).toBe(true);
    },
  );

  it.each([0, 4, 1.5])(
    'rejects ranked endpoint results %s (out of bounds)',
    (results) => {
      const result = BrightDataConfigSchema.safeParse({
        ...validConfig,
        web: { enabled: true, results },
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
      const result = BrightDataConfigSchema.safeParse({
        ...validConfig,
        images: { enabled: true, results },
      });
      expect(result.success).toBe(true);
    },
  );

  it.each([0, 201, 1.5])(
    'rejects media endpoint results %s (out of bounds)',
    (results) => {
      const result = BrightDataConfigSchema.safeParse({
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
    const result = BrightDataConfigSchema.safeParse(withoutScrape);
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes('scrape'))).toBe(
      true,
    );
  });
});
