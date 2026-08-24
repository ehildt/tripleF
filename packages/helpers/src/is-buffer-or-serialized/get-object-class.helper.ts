/**
 * Gets the [[Class]] internal property of an object using Object.prototype.toString.
 * This is cross-realm safe but can be spoofed via Symbol.toStringTag.
 */
export function getObjectClass(obj: object): string {
  return Object.prototype.toString.call(obj);
}
