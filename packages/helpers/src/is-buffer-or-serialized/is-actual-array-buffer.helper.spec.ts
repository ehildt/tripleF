import { isActualArrayBuffer } from './is-actual-array-buffer.helper.ts';

describe('isActualArrayBuffer', () => {
  it('should return true for actual ArrayBuffer', () => {
    expect(isActualArrayBuffer(new ArrayBuffer(8))).toBe(true);
  });

  it('should return false for SharedArrayBuffer', () => {
    expect(isActualArrayBuffer(new SharedArrayBuffer(8))).toBe(false);
  });

  it('should return false for TypedArray', () => {
    expect(isActualArrayBuffer(new Uint8Array(8))).toBe(false);
  });

  it('should return false for object with spoofed toStringTag', () => {
    const fake = { [Symbol.toStringTag]: 'ArrayBuffer' };
    expect(isActualArrayBuffer(fake)).toBe(false);
  });

  it('should return false for plain object', () => {
    expect(isActualArrayBuffer({})).toBe(false);
  });
});
