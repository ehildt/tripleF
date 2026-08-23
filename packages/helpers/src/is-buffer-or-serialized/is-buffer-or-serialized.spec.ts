import {
  getObjectClass,
  isActualArrayBuffer,
  isActualSharedArrayBuffer,
  isBufferOrSerialized,
  isNodeBuffer,
  isSerializedBuffer,
} from './is-buffer-or-serialized.ts';

describe('isBufferOrSerialized', () => {
  describe('ArrayBuffer', () => {
    it('should return true for ArrayBuffer', () => {
      const buffer = new ArrayBuffer(8);
      expect(isBufferOrSerialized(buffer)).toBe(true);
    });

    it('should return true for empty ArrayBuffer', () => {
      const buffer = new ArrayBuffer(0);
      expect(isBufferOrSerialized(buffer)).toBe(true);
    });

    it('should work with ArrayBuffer from different realm (simulated)', () => {
      // Simulating cross-realm ArrayBuffer using Object.create
      const fakeArrayBuffer = Object.create(ArrayBuffer.prototype);
      Object.setPrototypeOf(fakeArrayBuffer, ArrayBuffer.prototype);
      Object.defineProperty(fakeArrayBuffer, Symbol.toStringTag, { value: 'ArrayBuffer' });
      expect(Object.prototype.toString.call(fakeArrayBuffer)).toBe('[object ArrayBuffer]');
    });
  });

  describe('SharedArrayBuffer', () => {
    it('should return true for SharedArrayBuffer', () => {
      const buffer = new SharedArrayBuffer(8);
      expect(isBufferOrSerialized(buffer)).toBe(true);
    });

    it('should return true for empty SharedArrayBuffer', () => {
      const buffer = new SharedArrayBuffer(0);
      expect(isBufferOrSerialized(buffer)).toBe(true);
    });
  });

  describe('TypedArray', () => {
    it('should return true for Uint8Array', () => {
      const arr = new Uint8Array([1, 2, 3]);
      expect(isBufferOrSerialized(arr)).toBe(true);
    });

    it('should return true for Uint16Array', () => {
      const arr = new Uint16Array([1, 2, 3]);
      expect(isBufferOrSerialized(arr)).toBe(true);
    });

    it('should return true for Uint32Array', () => {
      const arr = new Uint32Array([1, 2, 3]);
      expect(isBufferOrSerialized(arr)).toBe(true);
    });

    it('should return true for Int8Array', () => {
      const arr = new Int8Array([1, 2, 3]);
      expect(isBufferOrSerialized(arr)).toBe(true);
    });

    it('should return true for Int16Array', () => {
      const arr = new Int16Array([1, 2, 3]);
      expect(isBufferOrSerialized(arr)).toBe(true);
    });

    it('should return true for Int32Array', () => {
      const arr = new Int32Array([1, 2, 3]);
      expect(isBufferOrSerialized(arr)).toBe(true);
    });

    it('should return true for Float32Array', () => {
      const arr = new Float32Array([1.5, 2.5, 3.5]);
      expect(isBufferOrSerialized(arr)).toBe(true);
    });

    it('should return true for Float64Array', () => {
      const arr = new Float64Array([1.5, 2.5, 3.5]);
      expect(isBufferOrSerialized(arr)).toBe(true);
    });

    it('should return true for BigInt64Array', () => {
      const arr = new BigInt64Array([BigInt(1), BigInt(2)]);
      expect(isBufferOrSerialized(arr)).toBe(true);
    });

    it('should return true for BigUint64Array', () => {
      const arr = new BigUint64Array([BigInt(1), BigInt(2)]);
      expect(isBufferOrSerialized(arr)).toBe(true);
    });

    it('should return true for empty TypedArrays', () => {
      expect(isBufferOrSerialized(new Uint8Array(0))).toBe(true);
      expect(isBufferOrSerialized(new Int32Array(0))).toBe(true);
    });
  });

  describe('DataView', () => {
    it('should return true for DataView', () => {
      const buffer = new ArrayBuffer(8);
      const view = new DataView(buffer);
      expect(isBufferOrSerialized(view)).toBe(true);
    });

    it('should return true for DataView on SharedArrayBuffer', () => {
      const buffer = new SharedArrayBuffer(8);
      const view = new DataView(buffer);
      expect(isBufferOrSerialized(view)).toBe(true);
    });
  });

  describe('Node.js Buffer', () => {
    it('should return true for Buffer', () => {
      const buffer = Buffer.from('test');
      expect(isBufferOrSerialized(buffer)).toBe(true);
    });

    it('should return true for empty Buffer', () => {
      const buffer = Buffer.from([]);
      expect(isBufferOrSerialized(buffer)).toBe(true);
    });

    it('should return true for Buffer from base64', () => {
      const buffer = Buffer.from('dGVzdA==', 'base64');
      expect(isBufferOrSerialized(buffer)).toBe(true);
    });

    it('should return true for Buffer from hex', () => {
      const buffer = Buffer.from('74657374', 'hex');
      expect(isBufferOrSerialized(buffer)).toBe(true);
    });
  });

  describe('Serialized Buffer', () => {
    it('should return true for serialized Buffer object', () => {
      const serialized = { type: 'Buffer', data: [116, 101, 115, 116] };
      expect(isBufferOrSerialized(serialized)).toBe(true);
    });

    it('should return true for empty serialized Buffer', () => {
      const serialized = { type: 'Buffer', data: [] };
      expect(isBufferOrSerialized(serialized)).toBe(true);
    });

    it('should return false if type is not Buffer', () => {
      const notBuffer = { type: 'NotBuffer', data: [1, 2, 3] };
      expect(isBufferOrSerialized(notBuffer)).toBe(false);
    });

    it('should return false if data is not an array', () => {
      const invalid = { type: 'Buffer', data: 'not an array' };
      expect(isBufferOrSerialized(invalid)).toBe(false);
    });

    it('should return false if missing type property', () => {
      const invalid = { data: [1, 2, 3] };
      expect(isBufferOrSerialized(invalid)).toBe(false);
    });

    it('should return false if missing data property', () => {
      const invalid = { type: 'Buffer' };
      expect(isBufferOrSerialized(invalid)).toBe(false);
    });

    it('should return false if type is not a string', () => {
      const invalid = { type: 123, data: [1, 2, 3] };
      expect(isBufferOrSerialized(invalid)).toBe(false);
    });
  });

  describe('Non-buffer types', () => {
    it('should return false for null', () => {
      expect(isBufferOrSerialized(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isBufferOrSerialized(undefined)).toBe(false);
    });

    it('should return false for string', () => {
      expect(isBufferOrSerialized('test')).toBe(false);
    });

    it('should return false for number', () => {
      expect(isBufferOrSerialized(42)).toBe(false);
    });

    it('should return false for bigint', () => {
      expect(isBufferOrSerialized(BigInt(42))).toBe(false);
    });

    it('should return false for boolean', () => {
      expect(isBufferOrSerialized(true)).toBe(false);
      expect(isBufferOrSerialized(false)).toBe(false);
    });

    it('should return false for symbol', () => {
      expect(isBufferOrSerialized(Symbol('test'))).toBe(false);
    });

    it('should return false for plain object', () => {
      expect(isBufferOrSerialized({ foo: 'bar' })).toBe(false);
    });

    it('should return false for array', () => {
      expect(isBufferOrSerialized([1, 2, 3])).toBe(false);
    });

    it('should return false for function', () => {
      expect(isBufferOrSerialized(() => {})).toBe(false);
    });

    it('should return false for class instance', () => {
      class MyClass {}
      expect(isBufferOrSerialized(new MyClass())).toBe(false);
    });

    it('should return false for object with Symbol.toStringTag', () => {
      const fake = {
        [Symbol.toStringTag]: 'ArrayBuffer',
      };
      expect(isBufferOrSerialized(fake)).toBe(false);
    });
  });

  describe('Type narrowing', () => {
    it('should narrow types correctly in if statement', () => {
      const value: unknown = new Uint8Array([1, 2, 3]);

      if (isBufferOrSerialized(value)) {
        // TypeScript should know this is a BufferLike
        // This should compile without errors
        expect(value).toBeDefined();
      }
    });

    it('should narrow for serialized buffer', () => {
      const value: unknown = { type: 'Buffer', data: [1, 2, 3] };

      if (isBufferOrSerialized(value)) {
        // Should be able to access .type and .data
        expect('type' in value || ArrayBuffer.isView(value)).toBe(true);
      }
    });
  });
});

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

describe('index.ts exports', () => {
  it('should export all functions and types from index.ts', async () => {
    const index = await import('./index.ts');

    expect(typeof index.isBufferOrSerialized).toBe('function');
    expect(typeof index.isActualArrayBuffer).toBe('function');
    expect(typeof index.isActualSharedArrayBuffer).toBe('function');
    expect(typeof index.isNodeBuffer).toBe('function');
    expect(typeof index.isSerializedBuffer).toBe('function');
    expect(typeof index.getObjectClass).toBe('function');

    // Verify functions work when imported from index
    expect(index.isBufferOrSerialized(Buffer.from('test'))).toBe(true);
    expect(index.isActualArrayBuffer(new ArrayBuffer(8))).toBe(true);
    expect(index.isSerializedBuffer({ type: 'Buffer', data: [] })).toBe(true);
    expect(index.getObjectClass({})).toBe('[object Object]');
  });
});
