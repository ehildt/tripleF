import { SecretsConfigSchema } from './secrets-config.adapter.js';

describe('SecretsConfigSchema', () => {
  const validHex = 'a'.repeat(64);

  it('accepts empty config (all keys optional)', () => {
    expect(SecretsConfigSchema.safeParse({}).success).toBe(true);
  });

  it('accepts 64-char hex keys, upper- or lowercase', () => {
    expect(
      SecretsConfigSchema.safeParse({
        activeKey: validHex,
        previousKey: validHex.toUpperCase(),
      }).success,
    ).toBe(true);
  });

  it.each([
    'not-hex-'.repeat(8),
    'a'.repeat(63),
    'a'.repeat(65),
    'g'.repeat(64),
  ])('rejects invalid key %s', (key) => {
    const result = SecretsConfigSchema.safeParse({ activeKey: key });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes('activeKey'))).toBe(
      true,
    );
  });
});
