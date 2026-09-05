/** Cap on the rendered block, so a rich synopsis probe stays a cheap hint. */
const SYNOPSIS_PROBE_CHAR_LIMIT = 2000;

/**
 * Render cluster synopses as a block for the intent classifier — the
 * Raptor layer of the memory probe. A synopsis is the LLM-written community
 * summary over a cluster of related memory records (level 0) or over other
 * synopses (level 1+, the higher the broader). They surface when the request
 * is cross-cutting: a question about a whole topic vector-matches the
 * community summary even when no single record ranks highly. Empty input →
 * undefined (no block).
 */
export function buildSynopsisProbeSection(
  synopses: Array<{ title: string; summary: string; level?: number }>,
): string | undefined {
  if (synopses.length === 0) return undefined;

  const body = synopses
    .map((synopsis) => `- ${synopsis.title}: ${synopsis.summary}${synopsis.level ? ` (level ${synopsis.level})` : ''}`)
    .join('\n');
  const capped = body.length > SYNOPSIS_PROBE_CHAR_LIMIT ? `${body.slice(0, SYNOPSIS_PROBE_CHAR_LIMIT)}…` : body;

  return `MEMORY SYNOPSES — YOUR community-level summaries of stored knowledge, retrieved for THIS request because the question spans a whole topic rather than one detail. Each synopsis condenses a cluster of records; treat it as orientation for what you know, not as a verbatim source. Use it to decide what to consult deeper (the encyclopedia tools, the memory recall tool), never treat it as the current request itself.
${capped}`;
}
