import { MemoryClientConfigSchema } from './memory-client-config.schema.js';

describe('MemoryClientConfigSchema', () => {
  it('accepts an empty config', () => {
    expect(MemoryClientConfigSchema.safeParse({}).success).toBe(true);
  });

  it('accepts a full config', () => {
    expect(
      MemoryClientConfigSchema.safeParse({
        url: 'http://localhost:3400',
        enabled: true,
      }).success,
    ).toBe(true);
  });

  it.each(['not a url', ''])('rejects invalid url %s', (url) => {
    const result = MemoryClientConfigSchema.safeParse({ url });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes('url'))).toBe(true);
  });

  it('rejects a non-boolean enabled', () => {
    expect(MemoryClientConfigSchema.safeParse({ enabled: 'yes' }).success).toBe(
      false,
    );
  });
});
