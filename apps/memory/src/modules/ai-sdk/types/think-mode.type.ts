/**
 * Internal type for the provider `think` parameter, normalised before passing
 * through. The official `ollama-ai-provider-v2` Zod schema currently only
 * accepts `ThinkMode: boolean`, but our internal type supports future-proof
 * string-level values `'low' | 'medium' | 'high'`.
 */
export type ThinkMode = boolean | 'low' | 'medium' | 'high';
