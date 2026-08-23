import { getNumberEnv } from './get-number-env.helper.ts';

describe('getNumberEnv', () => {
  // --- Valid integer strings ---
  test('parses integer strings correctly', () => {
    expect(getNumberEnv('42')).toBe(42);
    expect(getNumberEnv('0')).toBe(0);
    expect(getNumberEnv('-7')).toBe(-7);
  });

  // --- Valid float strings ---
  test('parses float strings correctly', () => {
    expect(getNumberEnv('3.14')).toBe(3.14);
    expect(getNumberEnv('0.0')).toBe(0);
    expect(getNumberEnv('-2.718')).toBe(-2.718);
  });

  // --- Comma as decimal separator ---
  test('normalizes comma to period and parses float', () => {
    expect(getNumberEnv('1,5')).toBe(1.5);
    expect(getNumberEnv('0,001')).toBe(0.001);
    expect(getNumberEnv('-3,14')).toBe(-3.14);
  });

  // --- Fallback behavior ---
  test('returns fallback when value is null or undefined', () => {
    expect(getNumberEnv(null, 10)).toBe(10);
    expect(getNumberEnv(undefined, 20)).toBe(20);
    expect(getNumberEnv(null)).toBeNull();
    expect(getNumberEnv(undefined)).toBeNull();
  });

  test('returns fallback when parsing fails', () => {
    expect(getNumberEnv('abc', 5)).toBe(5);
    expect(getNumberEnv('12abc', 7)).toBe(7);
  });

  // --- Parsing invalid strings without fallback ---
  test('returns null when parsing fails and no fallback is provided', () => {
    expect(getNumberEnv('abc')).toBeNull();
    expect(getNumberEnv('')).toBeNull();
    expect(getNumberEnv(' ')).toBeNull();
  });

  // --- Edge cases ---
  test('handles zero correctly', () => {
    expect(getNumberEnv('0')).toBe(0);
    expect(getNumberEnv('0.0')).toBe(0);
    expect(getNumberEnv('0,0')).toBe(0);
  });

  test('handles negative numbers', () => {
    expect(getNumberEnv('-42')).toBe(-42);
    expect(getNumberEnv('-3.14')).toBe(-3.14);
    expect(getNumberEnv('-1,5')).toBe(-1.5);
  });

  test('trims whitespace around numbers', () => {
    expect(getNumberEnv(' 42 ')).toBe(42);
    expect(getNumberEnv(' 3.14 ')).toBe(3.14);
    expect(getNumberEnv(' 1,5 ')).toBe(1.5);
  });

  // --- Very large numbers (BigInt support) ---
  test('handles numbers beyond Number.MAX_SAFE_INTEGER as BigInt', () => {
    const large = '9007199254740993'; // Number.MAX_SAFE_INTEGER + 2
    const result = getNumberEnv(large);
    expect(typeof result).toBe('bigint');
    expect(result).toBe(BigInt(large));
  });

  test('handles numbers within safe range as number', () => {
    const safe = '9007199254740991'; // Number.MAX_SAFE_INTEGER
    const result = getNumberEnv(safe);
    expect(typeof result).toBe('number');
    expect(result).toBe(Number(safe));
  });

  test('handles negative BigInt beyond safe range', () => {
    const largeNegative = '-9007199254740993';
    const result = getNumberEnv(largeNegative);
    expect(typeof result).toBe('bigint');
    expect(result).toBe(BigInt(largeNegative));
  });

  test('returns fallback when result is NaN', () => {
    expect(getNumberEnv('abc', 42)).toBe(42);
    expect(getNumberEnv('12abc', 99)).toBe(99);
  });

  test('handles value that passes regex but produces NaN', () => {
    expect(getNumberEnv('.')).toBeNull();
    expect(getNumberEnv('.', 50)).toBe(50);
  });
});
