import { isEmpty } from './is-empty.helper.ts';

describe('isEmpty', () => {
  // ✅ Empty objects
  test('returns true for empty object', () => {
    expect(isEmpty({})).toBe(true);
  });

  // ✅ Non-empty objects
  test('returns false for object with properties', () => {
    expect(isEmpty({ a: 1 })).toBe(false);
    expect(isEmpty({ a: undefined })).toBe(false); // key exists
  });

  // ✅ Empty arrays
  test('returns true for empty array', () => {
    expect(isEmpty([])).toBe(true);
  });

  // ✅ Non-empty arrays
  test('returns false for array with elements', () => {
    expect(isEmpty([1, 2])).toBe(false);
  });

  // ✅ Nested objects (shallow check only)
  test('returns true for object with no own keys (nested ignored)', () => {
    expect(isEmpty({ nested: {} })).toBe(false); // 'nested' key exists
  });

  // ✅ Reject primitives
  test('throws TypeError for null, undefined, string, number, boolean', () => {
    expect(() => isEmpty(null as any)).toThrow(TypeError);
    expect(() => isEmpty(undefined as any)).toThrow(TypeError);
    expect(() => isEmpty('' as any)).toThrow(TypeError);
    expect(() => isEmpty(123 as any)).toThrow(TypeError);
    expect(() => isEmpty(true as any)).toThrow(TypeError);
  });

  // ✅ Reject functions
  test('throws TypeError for functions', () => {
    expect(() => isEmpty(() => {})).toThrow(TypeError);
  });
});
