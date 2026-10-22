import { describe, expect, it } from 'vitest';

import {
  PostgresConfigAdapter,
  PostgresConfigSchema,
} from './postgres-config.adapter.js';

describe('PostgresConfigSchema', () => {
  const validConfig = {
    ...PostgresConfigAdapter({}),
    url: 'postgres://user:pw@host:5432/db',
  };

  it('accepts the adapter output with a postgres url', () => {
    expect(PostgresConfigSchema.safeParse(validConfig).success).toBe(true);
  });

  it('accepts a postgresql:// scheme', () => {
    expect(
      PostgresConfigSchema.safeParse({
        ...validConfig,
        url: 'postgresql://host/db',
      }).success,
    ).toBe(true);
  });

  it.each(['http://host/db', 'not a url', ''])('rejects url %s', (url) => {
    const result = PostgresConfigSchema.safeParse({ ...validConfig, url });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes('url'))).toBe(true);
  });

  it.each(['failed', 'cleared', 'removed'] as const)(
    'rejects a missing %s stage',
    (stage) => {
      const withoutStage = { ...validConfig } as Partial<typeof validConfig>;
      delete withoutStage[stage];
      const result = PostgresConfigSchema.safeParse(withoutStage);
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes(stage))).toBe(
        true,
      );
    },
  );

  it.each([1.5, 'abc'])(
    'rejects non-integer stage numbers %s',
    (retainAmount) => {
      const result = PostgresConfigSchema.safeParse({
        ...validConfig,
        failed: { retainAmount, maxAgeMs: 1000 },
      });
      expect(result.success).toBe(false);
    },
  );
});
