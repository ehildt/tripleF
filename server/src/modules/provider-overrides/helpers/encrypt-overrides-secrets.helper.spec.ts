import { describe, expect, it } from 'vitest';

import { encryptOverridesSecrets } from './encrypt-overrides-secrets.helper.js';

describe('encryptOverridesSecrets', () => {
  it('encrypts apiKey strings and preserves other fields', () => {
    const result = encryptOverridesSecrets(
      { serper: { apiKey: 'secret', enabled: true } },
      (plaintext) => `enc:${plaintext}`,
    );
    expect(result.serper).toEqual({ enabled: true, apiKey: 'enc:secret' });
  });

  it('drops empty apiKey values', () => {
    const result = encryptOverridesSecrets(
      { serper: { apiKey: '', enabled: true } },
      (plaintext) => `enc:${plaintext}`,
    );
    expect(result.serper).toEqual({ enabled: true });
  });

  it('omits apiKey when the cipher declines', () => {
    const result = encryptOverridesSecrets(
      { serper: { apiKey: 'secret' } },
      () => undefined,
    );
    expect(result.serper).toEqual({});
  });
});
