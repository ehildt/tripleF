import { EncyclopediaClassifySchema } from '../../schemas/encyclopedia-classify.schema.js';
import { buildStructuredPrompt } from '../helpers/build-structured-prompt.helper.js';

import { buildVocabularySection } from './vocabulary-section.helper.js';

/**
 * Structured output contract + task for the encyclopedia classification model. The
 * schema is derived from the zod template (the typed truth), followed by the
 * task rules and a final reminder. When the caller passes the encyclopedia's
 * existing category/topic vocabulary, it is appended as a reuse-first hint so the
 * model extends the taxonomy instead of minting near-duplicate labels. Topic
 * reuse matters most for tier-1 snippets: without the known-topics list the
 * model mints a variant per source ("neverness to everness", "nte", …) and the
 * constellation's topic tier fragments.
 */
export function buildEncyclopediaClassifyPrompt(
  knownCategories: readonly string[] = [],
  knownTopics: readonly string[] = [],
): string {
  return buildStructuredPrompt(EncyclopediaClassifySchema, {
    before: 'OUTPUT FORMAT — output ONLY valid JSON matching this exact schema:',
    after: `
YOUR TASK — label one stored source document with its broad category and the topic it is about:
- The document may be a fetched web page, an uploaded file, or a search-result snippet. Classify by its CONTENT, never by its source shape — a file has no domain, and that must not matter.
- category: ONE broad lowercase PLURAL family noun (e.g. "games", "work", "health", "finance") that groups the topic into a family. It labels the TOPIC — never a side theme or an incidental mention on the page. Never a specific entity, product, company, or title.
- topic: the document's MAIN subject entity — what the whole source is about (e.g. "wuthering waves", "q3 budget", "rust borrow checker"). A short, specific, reusable label — not a sentence, not a URL, not a filename, never a domain or a site name. Never a sub-part of the main subject (a chapter, a location, one feature) and never an adjacent proper noun (a publisher, an author, a related event) — when a title-level entity exists, it is the topic.
- When the document is about a KNOWN TOPIC, output that label VERBATIM — prefer "neverness to everness" over minting a variant like "nte".
${buildVocabularySection(knownCategories, knownTopics)}
RULES:
- Return ONLY a single valid JSON object matching the exact schema above.
- No markdown code fences, no explanations, preamble, or postscript.
- Never output undefined or null. Both keys are always present.

FINAL REMINDER:
- Output ONLY valid JSON matching the exact schema above. No markdown code fences, no explanations, preamble, or postscript.`,
  });
}
