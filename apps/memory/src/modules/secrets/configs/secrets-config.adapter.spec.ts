import { describe, expect, it } from 'vitest';

import {
  SecretsConfigAdapter,
  SecretsConfigSchema,
} from './secrets-config.adapter.js';

const KEY = 'a'.repeat(64);
const PREVIOUS = 'b'.repeat(64);

describe('SecretsConfigAdapter', () => {
  it('reads the active and previous keys from the environment', () => {
    const config = SecretsConfigAdapter({
      TRIPLEF_SECRETS_KEY: KEY,
      TRIPLEF_SECRETS_KEY_PREVIOUS: PREVIOUS,
    });

    expect(config).toEqual({ activeKey: KEY, previousKey: PREVIOUS });
  });

  it('leaves unset keys undefined instead of empty strings', () => {
    const config = SecretsConfigAdapter({});

    expect(config).toEqual({ activeKey: undefined, previousKey: undefined });
  });

  it('treats empty values as unset', () => {
    const config = SecretsConfigAdapter({
      TRIPLEF_SECRETS_KEY: '',
      TRIPLEF_SECRETS_KEY_PREVIOUS: '',
    });

    expect(config.activeKey).toBeUndefined();
    expect(config.previousKey).toBeUndefined();
  });
});

describe('SecretsConfigSchema', () => {
  it('accepts empty config (all keys optional)', () => {
    expect(SecretsConfigSchema.safeParse({}).success).toBe(true);
  });

  it('accepts 64-char hex keys, upper- or lowercase', () => {
    expect(
      SecretsConfigSchema.safeParse({
        activeKey: KEY,
        previousKey: PREVIOUS.toUpperCase(),
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
    expect(
      result.error?.issues.some((issue) => issue.path.includes('activeKey')),
    ).toBe(true);
  });
});
