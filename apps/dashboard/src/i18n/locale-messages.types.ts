/**
 * Shape of the user-facing UI chrome messages. Every locale file must satisfy
 * this contract so missing keys are caught at compile time. Content (the model
 * output) is localized by the harness prompts, not by vue-i18n.
 *
 * The type is derived from the Zod schema in `./locale-schema` (via `z.infer`),
 * so the schema is the single source of truth for the shape. Extend the schema
 * when adding a key — do not hand-edit this type.
 */
export type { LocaleMessages } from './locale-schema';
