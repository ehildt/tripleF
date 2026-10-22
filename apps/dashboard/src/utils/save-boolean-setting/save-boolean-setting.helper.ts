/**
 * Persist a boolean setting to localStorage as the string 'true'/'false'.
 * When storage is unavailable the setting silently stays in-memory only.
 */
export function saveBooleanSetting(key: string, value: boolean): void {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    /* storage unavailable — the setting stays in-memory only */
  }
}
