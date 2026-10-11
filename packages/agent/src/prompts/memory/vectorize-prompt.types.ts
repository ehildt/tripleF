/**
 * Which side of a conversation turn the extraction source text came from:
 * the user's own message, or a flattened digest of the assistant's generated
 * answer. The extraction prompt's SOURCE VOICE rules key off it — assistant-
 * side opinions, verdicts, and recommendations are never stored as facts
 * and never attributed to the user.
 */
export type ExtractionSourceRole = 'user' | 'assistant';
