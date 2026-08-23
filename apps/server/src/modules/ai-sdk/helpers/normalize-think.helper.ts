import { ThinkMode } from '../types/think-mode.type.js';

/**
 * Normalise the various string / boolean forms that callers may supply
 * for the `keep` parameter into our internal `ThinkMode` type.
 *
 *  - `'off'` maps to `false` (disallow thinking)
 *  - `true` / `false` pass through unchanged
 *  - `'low'` / `'medium'` / `'high'` pass through unchanged
 *  - `undefined` returns `undefined` (omit the option)
 */
export function normalizeThink(raw?: string | boolean): ThinkMode | undefined {
  if (raw === undefined) return undefined;
  if (typeof raw === 'boolean') return raw;
  if (raw === 'off') return false;
  if (raw === 'low' || raw === 'medium' || raw === 'high') return raw;
  return undefined;
}
