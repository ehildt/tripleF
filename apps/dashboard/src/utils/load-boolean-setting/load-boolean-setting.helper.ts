/**
 * Read a boolean setting from localStorage, falling back to the given default
 * when the key is missing, unpersisted, or storage is unavailable. Only the
 * persisted string 'true' counts as enabled.
 */
export function loadBooleanSetting(key: string, fallback: boolean): boolean {
  try {
    const saved = localStorage.getItem(key);
    return saved === null ? fallback : saved === 'true';
  } catch {
    return fallback;
  }
}
