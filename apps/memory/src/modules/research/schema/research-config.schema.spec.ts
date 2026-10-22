import { describe, expect, it } from 'vitest';

import { ResearchConfigSchema } from './research-config.schema.js';

describe('ResearchConfigSchema', () => {
  it('accepts an empty config (all knobs optional)', () => {
    const result = ResearchConfigSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts a fully populated config', () => {
    const result = ResearchConfigSchema.safeParse({
      enabled: true,
      searchEnabled: true,
      provider: 'serper',
      model: 'qwen3:4b',
      gapLimit: 5,
      maxDepth: 2,
      fetchBudget: 10,
      frictionLimit: 5,
      serper: {
        enabled: true,
        apiKey: 'key',
        web: { enabled: true, results: 3 },
      },
      brightData: {
        enabled: true,
        apiKey: 'key',
        serpZone: 'zone',
        web: { enabled: false, results: 2 },
      },
    });
    expect(result.success).toBe(true);
  });

  it('rejects an unknown provider', () => {
    const result = ResearchConfigSchema.safeParse({ provider: 'youtube' });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes('provider'))).toBe(
      true,
    );
  });

  it.each([
    ['gapLimit', 0],
    ['gapLimit', 51],
    ['maxDepth', 0],
    ['maxDepth', 4],
    ['fetchBudget', 0],
    ['fetchBudget', 21],
    ['frictionLimit', 0],
    ['frictionLimit', 21],
  ])('rejects %s %s (out of bounds)', (field, value) => {
    const result = ResearchConfigSchema.safeParse({ [field]: value });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes(field))).toBe(true);
  });

  it.each([
    ['gapLimit', 50],
    ['maxDepth', 3],
    ['fetchBudget', 20],
    ['frictionLimit', 20],
  ])('accepts %s %s (upper bound)', (field, value) => {
    const result = ResearchConfigSchema.safeParse({ [field]: value });
    expect(result.success).toBe(true);
  });

  it('rejects provider web.results out of range', () => {
    const result = ResearchConfigSchema.safeParse({
      serper: { web: { results: 4 } },
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes('results'))).toBe(
      true,
    );
  });
});
