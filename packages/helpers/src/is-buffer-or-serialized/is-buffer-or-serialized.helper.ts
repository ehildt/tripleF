import { isActualArrayBuffer } from './is-actual-array-buffer.helper.ts';
import { isActualSharedArrayBuffer } from './is-actual-shared-array-buffer.helper.ts';
import type { BufferLike } from './is-buffer-or-serialized.helper.types.ts';
import { isNodeBuffer } from './is-node-buffer.helper.ts';
import { isSerializedBuffer } from './is-serialized-buffer.helper.ts';

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
