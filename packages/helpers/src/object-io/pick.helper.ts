/**
 * Creates a new object by selecting only the specified keys from the original object.
 *
 * @template T - The type of the source object.
 * @template K - The keys of T to pick.
 * @param {T} obj - The source object.
 * @param {K[]} keys - An array of keys to include in the new object.
 * @returns {Pick<T, K>} A new object containing only the specified keys.
 *
 * @example
 * const user = { id: 1, name: 'Alice', age: 25 };
 * const result = pick(user, ['id', 'name']);
 * // result: { id: 1, name: 'Alice' }
 */
export function pick<T extends object, K extends keyof T>(obj: T, keys: Array<K>): Pick<T, K> {
  const result = {} as Pick<T, K>;

  keys.forEach((key) => {
    if (key in obj) result[key] = obj[key];
  });

  return result;
}
