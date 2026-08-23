import { getBooleanEnv } from './get-boolean-env.helper.ts';

describe('getBooleanEnv', () => {
  test('returns true for string "true"', () => {
    expect(getBooleanEnv('true')).toBe(true);
  });

  test('returns true for string "trueSomething"', () => {
    expect(getBooleanEnv('trueSomething')).toBe(true);
  });

  test('returns false for string "false"', () => {
    expect(getBooleanEnv('false')).toBe(false);
  });

  test('returns null when value is undefined and fallback is not provided', () => {
    expect(getBooleanEnv(undefined)).toBeNull();
  });

  test('returns fallback when value is undefined', () => {
    expect(getBooleanEnv(undefined, true)).toBe(true);
    expect(getBooleanEnv(undefined, false)).toBe(false);
  });

  test('returns fallback when value is null', () => {
    expect(getBooleanEnv(null, true)).toBe(true);
    expect(getBooleanEnv(null, false)).toBe(false);
  });

  // --- Case insensitivity ---
  test('handles case insensitivity for true values', () => {
    expect(getBooleanEnv('TRUE')).toBe(true);
    expect(getBooleanEnv('True')).toBe(true);
    expect(getBooleanEnv('true')).toBe(true);
  });

  test('handles case insensitivity for false values', () => {
    expect(getBooleanEnv('FALSE')).toBe(false);
    expect(getBooleanEnv('False')).toBe(false);
    expect(getBooleanEnv('false')).toBe(false);
  });

  test('handles mixed case values', () => {
    expect(getBooleanEnv('TrUe')).toBe(true);
    expect(getBooleanEnv('FaLsE')).toBe(false);
  });
});
