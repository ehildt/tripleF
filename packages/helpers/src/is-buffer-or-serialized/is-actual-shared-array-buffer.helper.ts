import { getObjectClass } from './get-object-class.helper.ts';

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
