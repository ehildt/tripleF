import { describe, expect, it } from 'vitest';

import { isMaskedApiKey, maskApiKey } from './mask-api-key.helper.js';

describe('maskApiKey', () => {
  it('masks a real key as a fixed run of asterisks', () => {
    expect(maskApiKey('sk-secret-123')).toBe('****************');
  });

  it('returns undefined for an undefined key', () => {
    expect(maskApiKey(undefined)).toBe(undefined);
  });
});

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
