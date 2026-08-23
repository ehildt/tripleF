import { getByteSizeEnv } from './get-byte-size-env.helper.ts';

describe('getByteSizeEnv', () => {
  // --- Valid byte sizes ---
  test('parses B correctly', () => {
    expect(getByteSizeEnv('100B')).toBe(100);
    expect(getByteSizeEnv('0B')).toBe(0);
  });

  test('parses KB correctly', () => {
    expect(getByteSizeEnv('1KB')).toBe(1024);
    expect(getByteSizeEnv('100KB')).toBe(102400);
  });

  test('parses MB correctly', () => {
    expect(getByteSizeEnv('1MB')).toBe(1048576);
    expect(getByteSizeEnv('5MB')).toBe(5242880);
  });

  test('parses GB correctly', () => {
    expect(getByteSizeEnv('1GB')).toBe(1073741824);
    expect(getByteSizeEnv('2GB')).toBe(2147483648);
  });

  test('parses TB correctly', () => {
    expect(getByteSizeEnv('1TB')).toBe(1099511627776);
    expect(getByteSizeEnv('2TB')).toBe(2199023255552);
  });

  // --- Decimals ---
  test('parses decimal values correctly', () => {
    expect(getByteSizeEnv('1.5MB')).toBe(1572864);
    expect(getByteSizeEnv('0.5GB')).toBe(536870912);
    expect(getByteSizeEnv('0.25GB')).toBe(268435456);
  });

  // --- Case insensitivity ---
  test('handles case insensitivity', () => {
    expect(getByteSizeEnv('1kb')).toBe(1024);
    expect(getByteSizeEnv('1Kb')).toBe(1024);
    expect(getByteSizeEnv('1mb')).toBe(1048576);
    expect(getByteSizeEnv('1gB')).toBe(1073741824);
  });

  // --- Whitespace trimming ---
  test('trims whitespace around values', () => {
    expect(getByteSizeEnv(' 100MB ')).toBe(104857600);
    expect(getByteSizeEnv('\t1GB\t')).toBe(1073741824);
    expect(getByteSizeEnv('\n 2MB\n')).toBe(2097152);
  });

  // --- Fallback on null/undefined ---
  test('returns fallback when value is null', () => {
    expect(getByteSizeEnv(null, 10)).toBe(10);
  });

  test('returns fallback when value is undefined', () => {
    expect(getByteSizeEnv(undefined, 20)).toBe(20);
  });

  test('returns null when value is null/undefined with no fallback', () => {
    expect(getByteSizeEnv(null)).toBeNull();
    expect(getByteSizeEnv(undefined)).toBeNull();
  });

  // --- Fallback on invalid format ---
  test('returns fallback when parsing fails', () => {
    expect(getByteSizeEnv('abc', 5)).toBe(5);
    expect(getByteSizeEnv('100', 5)).toBe(5);
    expect(getByteSizeEnv('', 5)).toBe(5);
  });

  test('returns null when parsing fails and no fallback provided', () => {
    expect(getByteSizeEnv('abc')).toBeNull();
    expect(getByteSizeEnv('100')).toBeNull();
    expect(getByteSizeEnv('')).toBeNull();
  });

  // --- Zero fallback ---
  test('returns zero fallback correctly', () => {
    expect(getByteSizeEnv(null, 0)).toBe(0);
    expect(getByteSizeEnv(undefined, 0)).toBe(0);
    expect(getByteSizeEnv('invalid', 0)).toBe(0);
  });

  // --- Edge cases ---
  test('handles zero values', () => {
    expect(getByteSizeEnv('0MB')).toBe(0);
    expect(getByteSizeEnv('0.0MB')).toBe(0);
    expect(getByteSizeEnv('0GB')).toBe(0);
  });

  test('handles values without numbers', () => {
    expect(getByteSizeEnv('MB')).toBeNull();
    expect(getByteSizeEnv('GB', 100)).toBe(100);
  });

  test('handles edge cases that produce NaN', () => {
    expect(getByteSizeEnv('5.MB')).toBeNull();
    expect(getByteSizeEnv('.MB')).toBeNull();
  });

  test('handles regex match failure that results in NaN', () => {
    expect(getByteSizeEnv('invalid')).toBeNull();
    expect(getByteSizeEnv('no-number', 50)).toBe(50);
  });

  test('handles valid format but invalid number (NaN)', () => {
    expect(getByteSizeEnv('abcMB')).toBeNull();
    expect(getByteSizeEnv('abcMB', 100)).toBe(100);
  });
});
