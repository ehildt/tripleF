/**
 * Merge two JSON-like objects.
 * @param a - target object
 * @param b - source object
 * @param deep - if true, merge recursively; if false, shallow merge
 */
export const merge = (a: Record<string, any>, b: Record<string, any>, deep = false): Record<string, any> => {
  if (!deep) return { ...a, ...b };
  const result: Record<string, any> = { ...a };
  for (const key in b) {
    const valB = b[key];
    const valA = a[key];
    if (
      valA &&
      typeof valA === 'object' &&
      !Array.isArray(valA) &&
      valB &&
      typeof valB === 'object' &&
      !Array.isArray(valB)
    )
      result[key] = merge(valA, valB, true);
    else result[key] = valB;
  }
  return result;
};
