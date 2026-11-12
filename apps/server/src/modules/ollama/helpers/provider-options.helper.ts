import type { ProviderOptions } from '@triplef/ai-sdk';
import type { JSONValue } from 'ai';

import type { ThinkMode } from '../types/think-mode.type.js';

/** Optional generation settings translated into Ollama provider options. */
interface BuildProviderOptionsInput {
  /** Ollama context-window size mapped to options.num_ctx. */
  numCtx?: number;
  /** Reserved model keep-alive setting, currently omitted by the provider schema. */
  keepAlive?: string;
  /** Thinking mode normalized to the provider's currently supported boolean. */
  think?: ThinkMode;
}

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
export function buildProviderOptions(
  opts?: BuildProviderOptionsInput,
): ProviderOptions {
  const ollama: Record<string, JSONValue> = {};
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
