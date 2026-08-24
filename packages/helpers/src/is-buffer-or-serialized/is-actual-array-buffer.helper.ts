import { getObjectClass } from './get-object-class.helper.ts';

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
