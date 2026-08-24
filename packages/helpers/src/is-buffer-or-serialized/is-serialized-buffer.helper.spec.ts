import { isSerializedBuffer } from './is-serialized-buffer.helper.ts';

describe('isSerializedBuffer', () => {
  it('should return true for valid serialized buffer', () => {
    expect(isSerializedBuffer({ type: 'Buffer', data: [1, 2, 3] })).toBe(true);
  });

  it('should return true for empty data array', () => {
    expect(isSerializedBuffer({ type: 'Buffer', data: [] })).toBe(true);
  });

  it('should return false if type is not Buffer', () => {
    expect(isSerializedBuffer({ type: 'NotBuffer', data: [1, 2, 3] })).toBe(false);
  });

  it('should return false if data is not an array', () => {
    expect(isSerializedBuffer({ type: 'Buffer', data: 'not array' })).toBe(false);
  });

  it('should return false if missing type', () => {
    expect(isSerializedBuffer({ data: [1, 2, 3] })).toBe(false);
  });

  it('should return false if missing data', () => {
    expect(isSerializedBuffer({ type: 'Buffer' })).toBe(false);
  });

  it('should return false for plain object', () => {
    expect(isSerializedBuffer({})).toBe(false);
  });
});
