/**
 * The shared metadata rendering for memory records across the maintenance
 * prompts (friction screen, consolidation, conviction synthesis): one
 * parenthesized summary of the classified fields, present parts only.
 * Records stored before the metadata existed (or written by paths that don't
 * classify) simply render no suffix — the prompts judge by text then.
 */
export function formatFactMetadata(fact: {
  subject?: string;
  category?: string;
  kind?: string;
  stability?: string;
}): string {
  const parts = [
    fact.subject ? `subject: ${fact.subject}` : '',
    fact.category ? `category: ${fact.category}` : '',
    fact.kind ? `kind: ${fact.kind}` : '',
    fact.stability ? `stability: ${fact.stability}` : '',
  ].filter(Boolean);
  return parts.length ? ` (${parts.join('; ')})` : '';
}
