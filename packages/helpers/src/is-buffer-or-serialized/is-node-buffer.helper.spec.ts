import { isNodeBuffer } from './is-node-buffer.helper.ts';

describe('isNodeBuffer', () => {
  it('should return true for Node.js Buffer', () => {
    expect(isNodeBuffer(Buffer.from('test'))).toBe(true);
  });

  it('should return false for ArrayBuffer', () => {
    expect(isNodeBuffer(new ArrayBuffer(8))).toBe(false);
  });

  it('should return false for Uint8Array', () => {
    expect(isNodeBuffer(new Uint8Array(8))).toBe(false);
  });

  it('should return false for plain object', () => {
    expect(isNodeBuffer({})).toBe(false);
  });

  it('should handle Buffer.isBuffer being undefined gracefully', () => {
    // Save original isBuffer
    const originalIsBuffer = Buffer.isBuffer;

    // Mock Buffer.isBuffer to be undefined
    Object.defineProperty(Buffer, 'isBuffer', {
      value: undefined,
      configurable: true,
      writable: true,
    });

    try {
      // This tests the optional chaining branch: Buffer.isBuffer?.(obj)
      expect(isNodeBuffer(Buffer.from('test'))).toBe(undefined);
    } finally {
      // Restore original
      Object.defineProperty(Buffer, 'isBuffer', {
        value: originalIsBuffer,
        configurable: true,
        writable: true,
      });
    }
  });
});
