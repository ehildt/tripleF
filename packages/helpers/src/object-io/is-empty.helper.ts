/**
 * Checks if a JSON-like object or array is empty. \
 * This function only accepts plain objects or arrays. It throws a TypeError \
 * if called with a primitive (string, number, boolean, null, undefined, etc.). \
 * For objects, it checks if there are any own enumerable string-keyed properties. \
 * For arrays, it checks if the length is zero.
 *
 * @param obj - The object or array to check for emptiness.
 * @returns `true` if the object or array has no own properties, otherwise `false`.
 *
 * @throws {TypeError} If the argument is not an object or array.
 *
 * @example
 * isEmpty({});           // true
 * isEmpty({ a: 1 });     // false
 * isEmpty([]);           // true
 * isEmpty([1, 2]);       // false
 * isEmpty(null);         // throws TypeError
 * isEmpty('string');     // throws TypeError
 */
export function isEmpty(obj: Record<string, any> | any[]): boolean {
  if (!obj || typeof obj !== 'object') throw new TypeError('Expected a JSON object or array');
  return Object.keys(obj).length === 0;
}
