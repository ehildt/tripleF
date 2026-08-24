/**
 * Checks if an object is a Node.js Buffer.
 * Returns false in non-Node.js environments where Buffer is undefined.
 */
export function isNodeBuffer(obj: object): obj is Buffer {
  return typeof Buffer !== 'undefined' && Buffer.isBuffer?.(obj);
}
