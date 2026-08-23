/**
 * Parses an environment variable value into a boolean.
 *
 * @param {string | null | undefined} value - The environment variable value to parse.
 * @param {boolean} [fallback] - A fallback value to return if the input is undefined or null.
 * @returns {boolean | null} `true` if the value starts with "true", otherwise `false`; returns the fallback or null if the value is not provided.
 */
export function getBooleanEnv(value?: string | null, fallback?: boolean): boolean | null {
  if (value == null) return fallback ?? null;
  return value.toLowerCase().startsWith('true');
}
