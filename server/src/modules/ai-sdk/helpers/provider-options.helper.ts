import type { JSONValue } from 'ai';

import { ThinkMode } from './ollama.helpers.js';

/**
 * Build providerOptions for ollama-ai-provider-v2.
 *
 * The provider's Zod schema (`ollamaProviderOptions`) currently accepts:
 *   - think: boolean | undefined
 *   - options: { num_ctx, seed, ... }
 *
 * String thinking levels ('low', 'medium', 'high') and `keepAlive` are NOT
 * in the schema. The Zod `$strip` silently removes unknown keys, but Zod
 * `boolean()` rejects non-boolean values with a validation error.
 *
 * Strategy:
 *   - think: 'off' → false, true/`low`/`medium`/`high` → true (strings
 *     cannot be sent until upstream adds them to the Zod schema).
 *   - keepAlive: omitted — will be re-added once upstream exposes it.
 *   - options.num_ctx: passed as-is (supported by the schema).
 */
export function buildProviderOptions(opts?: {
  numCtx?: number;
  keepAlive?: string;
  think?: ThinkMode;
}): Record<string, Record<string, JSONValue | undefined>> {
  const ollama: Record<string, JSONValue | undefined> = {};
  // Only boolean think values pass the provider's Zod validation.
  // String levels are mapped to true for now; they will be sent natively
  // once the upstream provider adds z.enum(['low','medium','high']).
  if (opts?.think !== undefined) {
    ollama.think = opts.think === false ? false : Boolean(opts.think);
  }
  // keepAlive is not yet in the chat model Zod schema — omitted for now.
  // if (opts?.keepAlive !== undefined) ollama.keepAlive = opts.keepAlive;
  if (opts?.numCtx != null) ollama.options = { num_ctx: opts.numCtx };
  return Object.keys(ollama).length > 0 ? { ollama } : {};
}
