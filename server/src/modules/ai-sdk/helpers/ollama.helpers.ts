/**
 * Shared Ollama provider helpers.
 *
 * The official `ollama-ai-provider-v2` Zod schema currently only accepts
 * `think: boolean`.  We define our internal type as `boolean | 'low' | 'medium' | 'high'`
 * so that the DTOs and service layer are ready when the upstream provider
 * adds string-level thinking support.
 *
 * In `provider-options.helper.ts` (used by `AiSdkService`), string levels
 * because the Zod schema rejects non-boolean values with a validation error.
 * They will pass through natively once the upstream schema is extended.
 *
 * `keepAlive` is not yet in the provider's Zod schema for chat models.
 * It is omitted from `providerOptions` for now; it will be re-added once
 * upstream exposes it.
 */

export type ThinkMode = boolean | 'low' | 'medium' | 'high';

/**
 * Normalise the various string / boolean forms that callers may supply
 * for the `think` parameter into our internal `ThinkMode` type.
 *
 *  - `'off'` maps to `false` (disable thinking)
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
