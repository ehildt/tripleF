import { getObjectClass } from './get-object-class.helper.ts';

describe('getObjectClass', () => {
  it('should return [object ArrayBuffer] for ArrayBuffer', () => {
    expect(getObjectClass(new ArrayBuffer(8))).toBe('[object ArrayBuffer]');
  });

  it('should return [object SharedArrayBuffer] for SharedArrayBuffer', () => {
    expect(getObjectClass(new SharedArrayBuffer(8))).toBe('[object SharedArrayBuffer]');
  });

  it('should return [object Uint8Array] for Uint8Array', () => {
    expect(getObjectClass(new Uint8Array(8))).toBe('[object Uint8Array]');
  });

  it('should return [object Object] for plain object', () => {
    expect(getObjectClass({})).toBe('[object Object]');
  });
});
