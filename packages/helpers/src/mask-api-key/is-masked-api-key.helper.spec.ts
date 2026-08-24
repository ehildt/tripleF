import { isMaskedApiKey } from './is-masked-api-key.helper.ts';

describe('isMaskedApiKey', () => {
  it('detects masked values', () => {
    expect(isMaskedApiKey('****************')).toBe(true);
  });

  it('rejects real keys', () => {
    expect(isMaskedApiKey('sk-secret-123')).toBe(false);
  });

  it('rejects non-strings', () => {
    expect(isMaskedApiKey(123)).toBe(false);
    expect(isMaskedApiKey(undefined)).toBe(false);
  });
});
