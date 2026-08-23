/**
 * Creates a new object by omitting the specified keys from the original object.
 *
 * @template T - The type of the source object.
 * @template K - The keys of T that should be omitted.
 * @param {T} obj - The source object.
 * @param {K[]} keys - An array of keys to omit from the source object.
 * @returns {Omit<T, K>} A new object with the specified keys removed.
 *
 * @example
 * const user = { id: 1, name: 'Alice', age: 25 };
 * const result = omit(user, ['age']);
 * // result: { id: 1, name: 'Alice' }
 */
export function omit<T extends object, K extends keyof T>(obj: T, keys: Array<K>): Omit<T, K> {
  const result = {} as Omit<T, K>;

  (Object.keys(obj) as Array<keyof T>).forEach((key) => {
    if (!keys.includes(key as K)) {
      const safeKey = key as Exclude<keyof T, K>;
      result[safeKey] = obj[safeKey as keyof T] as T[typeof safeKey];
    }
  });

  return result;
}
