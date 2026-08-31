/** Shallow-copy a result item before filtering/mapping it. */
export function copyResult<T>(r: T): T {
  return { ...r };
}
