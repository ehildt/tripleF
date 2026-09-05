import { MemoryEnrichmentSchema } from '../../schemas/memory/enrichment.schema.js';
import { buildStructuredPrompt } from '../helpers/build-structured-prompt.helper.js';

/**
 * Prompt for the relink job's optional enrichment step — refines one stored
 * memory record's topic labels. Gated behind the relink job's `enrich` flag:
 * tags are the recall filter vocabulary, so rewriting them changes which
 * records a future topic-filtered recall can find.
 */
export function buildEnrichPrompt(): string {
  return buildStructuredPrompt(MemoryEnrichmentSchema, {
    before: 'OUTPUT FORMAT — output ONLY valid JSON matching this exact schema:',
    after: `
YOUR TASK — refine the topic labels of ONE stored memory record:
- Keep the existing tags that are still accurate and reusable.
- Add any missing stable, lowercase topic labels that would help a future topic-filtered recall find this record.
- 2 to 6 tags total, lowercase, reusable, deduplicated.
- Tags are labels only — never rewrite or summarize the record text itself.

RULES:
- Return ONLY a single valid JSON object matching the exact schema above.
- No markdown code fences, no explanations, preamble, or postscript.
- Never output undefined or null. The key is always present (empty array when no tags apply).

FINAL REMINDER:
- Output ONLY valid JSON matching the exact schema above. No markdown code fences, no explanations, preamble, or postscript.`,
  });
}
