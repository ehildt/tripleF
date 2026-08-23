/**
 * Deep clone a JSON-like object or array
 * @param obj - object or array to clone
 */
export function clone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
