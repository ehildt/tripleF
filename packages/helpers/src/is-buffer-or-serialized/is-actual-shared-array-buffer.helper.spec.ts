import { isActualSharedArrayBuffer } from './is-actual-shared-array-buffer.helper.ts';

describe('isActualSharedArrayBuffer', () => {
  it('should return true for actual SharedArrayBuffer', () => {
    expect(isActualSharedArrayBuffer(new SharedArrayBuffer(8))).toBe(true);
  });

  it('should return false for ArrayBuffer', () => {
    expect(isActualSharedArrayBuffer(new ArrayBuffer(8))).toBe(false);
  });

  it('should return false for TypedArray', () => {
    expect(isActualSharedArrayBuffer(new Uint8Array(8))).toBe(false);
  });

  it('should return false for object with spoofed toStringTag', () => {
    const fake = { [Symbol.toStringTag]: 'SharedArrayBuffer' };
    expect(isActualSharedArrayBuffer(fake)).toBe(false);
  });

  it('should return false for plain object', () => {
    expect(isActualSharedArrayBuffer({})).toBe(false);
  });
});
