import { describe, expect, it } from 'vitest';

import {
  PlaywrightMcpConfigAdapter,
  PlaywrightMcpConfigSchema,
} from './playwright-mcp-config.adapter.js';

describe('PlaywrightMcpConfigSchema', () => {
  const validConfig = PlaywrightMcpConfigAdapter({});

  it('accepts the adapter output', () => {
    expect(PlaywrightMcpConfigSchema.safeParse(validConfig).success).toBe(true);
  });

  it('accepts a tools allow-list', () => {
    expect(
      PlaywrightMcpConfigSchema.safeParse({
        ...validConfig,
        tools: ['browser_navigate'],
      }).success,
    ).toBe(true);
  });

  it('rejects an empty tools allow-list', () => {
    const result = PlaywrightMcpConfigSchema.safeParse({
      ...validConfig,
      tools: [],
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes('tools'))).toBe(
      true,
    );
  });

  it.each(['not a url', ''])('rejects invalid url %s', (url) => {
    const result = PlaywrightMcpConfigSchema.safeParse({ ...validConfig, url });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes('url'))).toBe(true);
  });

  it('rejects a missing enabled flag', () => {
    const withoutEnabled = { ...validConfig } as Partial<typeof validConfig>;
    delete withoutEnabled.enabled;
    expect(PlaywrightMcpConfigSchema.safeParse(withoutEnabled).success).toBe(
      false,
    );
  });
});
