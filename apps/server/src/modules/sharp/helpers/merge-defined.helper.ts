/**
 * Spread-merge a partial patch over a base, skipping `undefined` patch fields.
 *
 * Class-transformed DTO instances carry every declared field as an own prop
 * (`undefined` when the caller omitted it). Spreading such an instance
 * verbatim would clobber the base with `undefined`; `null` is kept because
 * it is a meaningful "reset" value for nullable fields (e.g. maxHeight).
 */
export function mergeDefined<T extends object>(
  base: T | undefined,
  patch: Partial<T> | undefined,
): T {
  const result = { ...base } as Record<string, unknown>;
  for (const [key, value] of Object.entries(patch ?? {})) {
    if (value !== undefined) result[key] = value;
  }
  return result as T;
}
