import { EncyclopediaClassifySchema } from '../../schemas/encyclopedia-classify.schema.js';
import { buildStructuredPrompt } from '../helpers/build-structured-prompt.helper.js';

import { buildVocabularySection } from './vocabulary-section.helper.js';
import type { TaxonomyVocabulary } from './vocabulary-section.types.js';

/**
 * Structured output contract + task for the encyclopedia classification model. The
 * schema is derived from the zod template (the typed truth), followed by the
 * task rules and a final reminder. When the caller passes the encyclopedia's
 * taxonomy vocabulary (ranked by relevance to the document) — it is appended as
 * a reuse-first hint so the model extends the taxonomy instead of minting
 * near-duplicate labels. Topic reuse matters most for tier-1 snippets: without
 * the known-vocabulary list the model mints a variant per source ("neverness to
 * everness", "nte", …) and the constellation's topic tier fragments.
 */
export function buildEncyclopediaClassifyPrompt(vocabulary: TaxonomyVocabulary = {}): string {
  return buildStructuredPrompt(EncyclopediaClassifySchema, {
    before: 'OUTPUT FORMAT — output ONLY valid JSON matching this exact schema:',
    after: `
YOUR TASK — label one stored source document with its place in the macro-taxonomy:

TAXONOMY HIERARCHY (top-down): CLUSTER → COMMUNITY → HUB → NODE → LEAF
- CLUSTER = a broad PLURAL family noun ("games", "work", "health") — the highest logical bucket.
- COMMUNITY = a PLURAL sub-family under one cluster ("survival-games" under "games") — a genre or domain branch.
- HUB = the SINGULAR main subject entity anchoring the document ("project zomboid", "wuthering waves") — a specific name, never pluralized.
- NODE = the SINGULAR aspect of the document under its hub ("base building" under "project zomboid", "department spend" under "q3 budget") — a named sub-entity or topic branch; the document's chunks are the LEAVES filed under it. The chain is strict: ALL FOUR labels are always present.

- The document may be a fetched web page, an uploaded file, or a search-result snippet. Classify by its CONTENT, never by its source shape — a file has no domain, and that must not matter.
- FICTION & ENTERTAINMENT CONTENT (absolute): a document about an entertainment work or fictional universe classifies by its real-world MEDIUM, never by the work's in-universe domains. A TV episode page about a character's family or career is NOT "family", "education", "business", or "science" — the category is the medium family (e.g. "shows"), the community a true plural sub-family (e.g. "tv-shows"), and the work's title is the topic (e.g. "breaking bad"), never the community.
- category (CLUSTER): ONE broad lowercase PLURAL family noun (e.g. "games", "work", "health", "finance") that groups the topic into a family. It labels the TOPIC — never a side theme or an incidental mention on the page. Never a specific entity, product, company, or title.
- community (COMMUNITY): ONE lowercase PLURAL sub-family narrowing the category (e.g. "survival-games" under "games"). Always present; never a specific entity, product, company, or title — a show/work title like "breaking-bad" is a hub, never a community.
- topic (HUB): the document's MAIN subject entity — what the whole source is about (e.g. "wuthering waves", "q3 budget", "rust borrow checker") — SINGULAR and specific. A short, reusable label — not a sentence, not a URL, not a filename, never a domain or a site name. Never a sub-part of the main subject (a chapter, a location, one feature) and never an adjacent proper noun (a publisher, an author, a related event) — when a title-level entity exists, it is the topic.
- node (NODE): the SINGULAR aspect of the document under its hub — the named sub-entity or topic branch the source focuses on (e.g. "base building" under "project zomboid"). Short and reusable — never a sentence, never a URL.
- When the document is about a KNOWN TOPIC, output that label VERBATIM — prefer "neverness to everness" over minting a variant like "nte".
- TAXONOMY PROBING (pick first, create if necessary): when the memory-taxonomy-probe tool is available, probe top-down — cluster → community → hub → node — before answering, and ADOPT returned candidates VERBATIM (a candidate's id becomes the next probe's parentId). CREATE a new label only when no candidate fits; on creation you may pass one "icon" from the curated taxonomy icon set for the deepest NEW label.
${buildVocabularySection(vocabulary)}
RULES:
- Return ONLY a single valid JSON object matching the exact schema above.
- No markdown code fences, no explanations, preamble, or postscript.
- Never output undefined or null. "category", "community", "topic", and "node" are always present; "icon" is omitted when it doesn't apply.

FINAL REMINDER:
- Output ONLY valid JSON matching the exact schema above. No markdown code fences, no explanations, preamble, or postscript.`,
  });
}
