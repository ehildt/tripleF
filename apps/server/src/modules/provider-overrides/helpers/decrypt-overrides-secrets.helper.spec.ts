import { describe, expect, it } from 'vitest';

import { decryptOverridesSecrets } from './decrypt-overrides-secrets.helper.js';

describe('decryptOverridesSecrets', () => {
  it('decrypts apiKey strings and preserves other fields', () => {
    const result = decryptOverridesSecrets(
      { serper: { apiKey: 'enc:secret', enabled: true } },
      (payload) => payload.replace('enc:', ''),
    );
    expect(result.serper).toEqual({ enabled: true, apiKey: 'secret' });
  });

  it('drops fields that fail to decrypt', () => {
    const result = decryptOverridesSecrets(
      { serper: { apiKey: 'enc:secret' } },
      () => null,
    );
    expect(result.serper).toEqual({});
  });

  it('preserves non-apiKey fields when apiKey is absent', () => {
    const result = decryptOverridesSecrets(
      { serper: { enabled: true } },
      () => 'x',
    );
    expect(result.serper).toEqual({ enabled: true });
  });
});
