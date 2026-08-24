/**
 * Represents a serialized Buffer object, typically produced by
 * `JSON.stringify(Buffer.from(...))` which outputs: `{ type: "Buffer", data: [...] }`
 */
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
export type BufferLike = ArrayBuffer | SharedArrayBuffer | ArrayBufferView | SerializedBuffer;
