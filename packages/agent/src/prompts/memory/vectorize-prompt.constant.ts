import { formatZodShape } from '../../schemas/helpers/zod/format-zod-shape.helper.js';
import { ExtractionSchema } from '../../schemas/memory/extraction.schema.js';
import { buildStructuredPrompt } from '../helpers/build-structured-prompt.helper.js';

import { buildVocabularySection } from './vocabulary-section.helper.js';

/** Static prompt strings for the vectorize extraction LLM step. */

/**
 * Structured output contract + task for the extraction model. The schema is
 * derived from the zod template in templates/extraction.schema.ts (the typed
 * truth), followed by the task rules and a final reminder. When the caller
 * passes the partition's existing category/tag vocabulary, it is appended as
 * a reuse-first hint so the model extends the taxonomy instead of minting
 * near-duplicate labels.
 */
export function buildExtractionPrompt(
  knownCategories: readonly string[] = [],
  knownTags: readonly string[] = [],
): string {
  return buildStructuredPrompt(ExtractionSchema, {
    before: 'OUTPUT FORMAT — output ONLY valid JSON matching this exact schema:',
    after: `
YOUR TASK — decide what is worth remembering:
- A fact is durable information that remains useful in a later, unrelated conversation: user preferences, decisions, contact details, project facts, technical constraints (e.g. "User prefers single-line if statements", "Sam's phone number is 555-1234", "User is building a vector memory feature").
- Be sensitive to the user's data: capture anything durable and user-specific the turn reveals — a stated preference, a decision, a constraint, a project detail, a person or subject they care about — even when it is phrased casually or buried in a longer message. Noticing and storing durable user data is expected; do not wait for an explicit "remember".
- Facts must be self-contained — no "this"/"that" references; write them as third-person statements.
- Storage mechanics: each fact is embedded as a whole and matched sentence-by-sentence at recall time (multi-variant retrieval). One dense sentence is fine — put the subject up front ("User prefers single-line if statements", not "They prefer that style").
- Skip transient content: greetings, small talk, one-off instructions, filler — anything with no future recall value. When in doubt about whether a detail is durable, keep it: a durable detail is cheaper to store than to lose.

FACT METADATA — every fact object carries the fields the maintenance passes (consolidate/reflect/conviction) interpret:
- text: the statement itself.
- subject (optional): the lowercase entity the fact is about — "user" by default, or a person, product, or project name ("sam", "stellar blade", "payments service"). Maintenance only ever compares facts about the SAME subject, so name it whenever the fact is about a specific entity.
- category (optional): ONE broad lowercase PLURAL family label for this fact, reusing the known vocabulary — inherits the turn-side category when omitted.
- kind (required): what kind of durable thing it is:
  - preference — likes, dislikes, wants, style choices
  - decision — a choice that was made (adoptions, migrations, purchases committed to)
  - state — the CURRENT, changeable situation (lives in X, uses version Y, runs Z) — newer statements supersede these
  - contact — contact details of a person (phone, email, address)
  - project — facts about ongoing work or projects
  - possession — things owned
  - relationship — how people relate ("sam is the user's brother")
  - fact — any other durable fact
- stability (required): "durable" — a long-term truth that should survive until contradicted (decisions, traits, history) — or "volatile" — a current state a newer statement is EXPECTED to replace (location, tooling, versions). When in doubt, choose durable.
- Tags: 2 to 6 stable, reusable, lowercase topic labels describing what the text is about (e.g. "work", "rust", "contacts", "amd", "stellar blade"). Tags are NARROW and specific — entity names, product names, game titles. They are the vocabulary for topic-filtered recall later.
- Category: ONE broad lowercase PLURAL family noun for the whole text (e.g. "stocks", "pets", "games", "health") that groups the narrow tags into one topic family. A category is NEVER a specific entity, product, company, or game title: "amd" belongs under "stocks"; "stellar blade" and "stellar blade blood rain" belong under "games". Always include it when facts are emitted; omit it when nothing durable is found.
- If nothing durable is found, return an empty facts array; tags may still label the topic when useful.
${buildVocabularySection(knownCategories, knownTags)}
PRIOR MEMORY (when the user message ends with an "ALREADY STORED IN MEMORY" section):
- That section lists facts already stored in YOUR long-term memory from prior turns. NEVER emit a fact already covered there.
- If this turn refines, corrects, or completes a stored fact, DO emit it — as one fuller, self-contained restatement (a full restatement of the corrected claim overwrites the old record in place; it is never a diff).
- A statement that flips or adds negation to a stored fact is NEW information — always emit it.
- Everything not covered by the section is extracted as usual.

RULES:
- Return ONLY a single valid JSON object matching the exact schema above.
- No markdown code fences, no explanations, preamble, or postscript.
- Never output undefined or null. Both keys are always present (empty array when none applies).

FINAL REMINDER:
- Output ONLY valid JSON matching the exact schema above. No markdown code fences, no explanations, preamble, or postscript.`,
  });
}

/**
 * JSON correction prompt for when the model's memory extraction could not be
 * parsed at all (empty output or output that fails the extraction schema).
 * Mirrors the harness's `buildIntentCorrectionPrompt` shape. The schema block
 * is rendered from the zod template (never a hand-written JSON example) — a
 * literal template taught weak models to echo its placeholder ellipses,
 * which JSON5 then rejects (`invalid character '.'`).
 */
export function buildExtractionCorrectionPrompt(error: string): string {
  return `Your previous response was not valid.
Error: ${error}

Return ONLY a single valid JSON object matching the extraction schema exactly:
${formatZodShape(ExtractionSchema)}
All object keys must be quoted with double quotes. "subject" and the per-fact "category" are optional; "kind" and "stability" are required on every fact.
Do not add markdown code fences, explanations, placeholders, or extra text.

FINAL REMINDER:
- Return ONLY a single valid JSON object. No markdown code fences, no explanations, no extra text.`;
}
