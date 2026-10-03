/**
 * Shared `query` argument description for every keyword-search tool.
 *
 * Search engines only ever see the query string — never the conversation or
 * the system prompt — so each query must stand alone and name its subject
 * explicitly. Kept in one place so all tools state the same contract.
 */
export const STANDALONE_QUERY_DESCRIPTION =
  'A standalone, self-contained search query that explicitly names the subject (title, entity, brand, person, place, or topic). Never copy the user message verbatim: rewrite short follow-ups (e.g. "what do the reviews say?") into a full query that names the established subject from the conversation (e.g. "Neverness to Everness NTE reviews").';

/**
 * Short tool-level clause reinforcing the standalone-query contract in each
 * generic search tool's description.
 */
export const STANDALONE_QUERY_TOOL_CLAUSE =
  'Always pass a standalone query that names the subject explicitly — never the user message verbatim.';
