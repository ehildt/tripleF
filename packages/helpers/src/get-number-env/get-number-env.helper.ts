/**
 * Parses an environment variable string into a number, supporting both integers and floats. \
 * Automatically normalizes commas to periods to handle decimal inputs like "1,5".
 *
 * Resolution order:
 * 1. Parses the provided string.
 * 2. Falls back to `fallback` if the value is null, undefined, or invalid.
 * 3. Returns `null` if parsing fails and no fallback is provided.
 *
 * @param {string | null | undefined} value - The environment variable value to parse.
 * @param {number} [fallback] - Optional fallback value if parsing fails or the value is undefined/null.
 * @returns {number | null} The parsed number (integer or float), the fallback, or null.
 *
 * @example
 * getNumberEnv("42")         // 42
 * getNumberEnv("3.14")       // 3.14
 * getNumberEnv("1,5")        // 1.5
 * getNumberEnv(null, 10)     // 10
 * getNumberEnv("invalid", 0) // 0
 */
export function getNumberEnv(value?: string | null, fallback?: number): number | bigint | null {
  if (value == null) return fallback ?? null;

  const normalized = value.trim().replace(',', '.');
  const floatRegex = /^-?\d+(\.\d+)?$/;
  if (!floatRegex.test(normalized)) return fallback ?? null;

  if (normalized.includes('.')) {
    return parseFloat(normalized);
  }
  const intVal = BigInt(normalized);
  if (intVal <= BigInt(Number.MAX_SAFE_INTEGER) && intVal >= BigInt(Number.MIN_SAFE_INTEGER)) {
    return Number(intVal);
  }
  return intVal;
}
