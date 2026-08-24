import { maskApiKey } from './mask-api-key.helper.ts';

describe('maskApiKey', () => {
  it('masks a real key as a fixed run of asterisks', () => {
    expect(maskApiKey('sk-secret-123')).toBe('****************');
  });

  it('returns undefined for an undefined key', () => {
    expect(maskApiKey(undefined)).toBe(undefined);
  });
});
