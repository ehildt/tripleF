/**
 * Represents a serialized Buffer object, typically produced by
 * `JSON.stringify(Buffer.from(...))` which outputs: `{ type: "Buffer", data: [...] }`
 */
// ts-unused-exports:disable-next-line
export type SerializedBuffer = {
  type: 'Buffer';
  data: number[];
};

/**
 * Union type of all buffer-like types supported by `isBufferOrSerialized`.
 * - Node.js `Buffer`
 * - `ArrayBuffer`
 * - `SharedArrayBuffer`
 * - `TypedArray` (Uint8Array, Int8Array, etc.)
 * - `DataView`
 * - Serialized Buffer format from JSON.parse of a Buffer
 */
// ts-unused-exports:disable-next-line
export type BufferLike = ArrayBuffer | SharedArrayBuffer | ReturnType<typeof ArrayBuffer.isView> | SerializedBuffer;

/**
 * Gets the [[Class]] internal property of an object using Object.prototype.toString.
 * This is cross-realm safe but can be spoofed via Symbol.toStringTag.
 */
export function getObjectClass(obj: object): string {
  return Object.prototype.toString.call(obj);
}

/**
 * Checks if an object is an actual ArrayBuffer (not spoofed via Symbol.toStringTag).
 * Uses instanceof for the primary check, with toString as fallback for cross-realm.
 */
export function isActualArrayBuffer(obj: object): obj is ArrayBuffer {
  // instanceof is fast and works in same-realm, but fails across iframes
  if (obj instanceof ArrayBuffer) return true;

  // Cross-realm fallback: check toString tag AND verify constructor
  // A spoofed object with Symbol.toStringTag won't have the correct constructor
  if (getObjectClass(obj) === '[object ArrayBuffer]') {
    // Verify by checking for the slice method which is unique to ArrayBuffer
    return typeof (obj as ArrayBuffer).slice === 'function';
  }

  return false;
}

/**
 * Checks if an object is an actual SharedArrayBuffer.
 * Similar to isActualArrayBuffer but for SharedArrayBuffer.
 */
export function isActualSharedArrayBuffer(obj: object): obj is SharedArrayBuffer {
  // instanceof check
  if (obj instanceof SharedArrayBuffer) return true;

  // Cross-realm fallback: check toString tag AND verify slice method exists
  // SharedArrayBuffer has slice method just like ArrayBuffer
  if (getObjectClass(obj) === '[object SharedArrayBuffer]') {
    return typeof (obj as SharedArrayBuffer).slice === 'function';
  }

  return false;
}

/**
 * Checks if an object is a Node.js Buffer.
 * Returns false in non-Node.js environments where Buffer is undefined.
 */
export function isNodeBuffer(obj: object): obj is Buffer {
  return typeof Buffer !== 'undefined' && Buffer.isBuffer?.(obj);
}

/**
 * Checks if an object matches the SerializedBuffer format.
 * Must have type: "Buffer" and data: number[]
 */
export function isSerializedBuffer(obj: object): obj is SerializedBuffer {
  const record = obj as Record<string, unknown>;
  return record.type === 'Buffer' && Array.isArray(record.data);
}

/**
 * Checks if a value is a buffer-like object or a serialized buffer.
 *
 * This function works across Node.js and browser environments, handling:
 * - Node.js `Buffer` instances
 * - `ArrayBuffer` and `SharedArrayBuffer`
 * - All TypedArrays (Uint8Array, Int16Array, Float32Array, etc.)
 * - `DataView` instances
 * - Serialized Buffer objects from `JSON.stringify(Buffer.from(...))`
 *
 * Uses cross-realm safe checks (works across iframes and workers).
 *
 * @param obj - The value to check
 * @returns `true` if the value is a buffer-like object or serialized buffer
 *
 * @example
 * ```typescript
 * isBufferOrSerialized(Buffer.from("test")); // true (Node.js)
 * isBufferOrSerialized(new Uint8Array([1, 2, 3])); // true
 * isBufferOrSerialized({ type: "Buffer", data: [1, 2, 3] }); // true
 * isBufferOrSerialized("plain string"); // false
 * ```
 */
export function isBufferOrSerialized(obj: unknown): obj is BufferLike {
  if (!obj || typeof obj !== 'object') return false;
  if (isActualArrayBuffer(obj)) return true;
  if (isActualSharedArrayBuffer(obj)) return true;
  if (ArrayBuffer.isView(obj)) return true;
  if (isNodeBuffer(obj)) return true;
  if (isSerializedBuffer(obj)) return true;
  return false;
}
