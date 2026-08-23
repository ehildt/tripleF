/**
 * Completion prompt for the case where the model skipped mandatory tools.
 * Sent once with only the missing tools available: the model must author the
 * inputs itself — the harness never fabricates tool queries, because it has
 * no understanding of the request (garbage harness queries were the exact
 * failure this replaces).
 */
export function buildMissingToolsPrompt(missing: string[]): string {
  return `COMPLETION REQUIRED — you skipped mandatory tools: ${missing.join(
    ', ',
  )}.
Call every tool in this list now, each in ONE response as parallel tool calls.
Author each input yourself: derive standalone queries from the attached image(s) and the conversation context, following the standalone query and per-endpoint crafting rules you already received. Every query must name the subject explicitly — never copy the user message or a filename verbatim.
Call ONLY the missing tools.`;
}
