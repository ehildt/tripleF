import { formatZodShape } from '../../schemas/helpers/zod/format-zod-shape.helper.js';
import { ExtractionSchema } from '../../schemas/memory/extraction.schema.js';
import { buildStructuredPrompt } from '../helpers/build-structured-prompt.helper.js';

import { buildVocabularySection, type TaxonomyVocabulary } from './vocabulary-section.helper.js';

/** Static prompt strings for the vectorize extraction LLM step. */

/**
 * Structured output contract + task for the extraction model. The schema is
 * derived from the zod template in templates/extraction.schema.ts (the typed
 * truth), followed by the task rules and a final reminder. When the caller
 * passes the partition's taxonomy vocabulary (ranked by relevance to the
 * source text), it is appended as a reuse-first hint so the model extends
 * the taxonomy instead of minting near-duplicate labels.
 */
export function buildExtractionPrompt(vocabulary: TaxonomyVocabulary = {}): string {
  return buildStructuredPrompt(ExtractionSchema, {
    before: 'OUTPUT FORMAT — output ONLY valid JSON matching this exact schema:',
    after: `
YOUR TASK — decide what is worth remembering:
- ROUTING BOUNDARY (absolute): this extraction feeds the memory partition — the OBJECTIVE fact store ONLY. Extract only objective, external-world facts and events: factual records, project details, decisions, states, possessions, contacts, relationships between people. You MUST NOT extract subjective user data — no preferences, likes/dislikes, interests, wants, behavioral traits, or internal states ("the user likes…", "the user is interested in…", "the user prefers…"). All user profile and persona data is deferred to the cognition tier; when the turn reveals ONLY subjective user data, return an empty facts array.
- A fact is durable, objective information that remains useful in a later, unrelated conversation: decisions, contact details, project facts, technical constraints, events (e.g. "Sam's phone number is 555-1234", "The user is building a vector memory feature", "The payments service migrated to PostgreSQL in November").
- Be sensitive to the user's data: capture anything durable and objective the turn reveals — a decision, a constraint, a project detail, a person or subject they care about — even when it is phrased casually or buried in a longer message. Noticing and storing durable factual data is expected; do not wait for an explicit "remember".
- Facts must be self-contained — no "this"/"that" references; write them as third-person statements.
- Storage mechanics: each fact is embedded as a whole and matched sentence-by-sentence at recall time (multi-variant retrieval). One dense sentence is fine — put the subject up front ("The payments service runs PostgreSQL 16", not "It runs that version").
- Skip transient content: greetings, small talk, one-off instructions, filler — anything with no future recall value. When in doubt about whether a detail is durable, keep it: a durable detail is cheaper to store than to lose. When in doubt about whether a detail is SUBJECTIVE, drop it — the cognition tier captures preferences and profile data.

FACT METADATA — every fact object carries the fields the maintenance passes (consolidate/reflect/conviction) interpret. Labels place the fact in the macro-taxonomy, top-down: CLUSTER → COMMUNITY → HUB → NODE, where the NODE is the fact itself (never named) and each tier above it narrows where it is filed:
- CLUSTER (category): a broad PLURAL family noun ("games", "stocks", "pets").
- COMMUNITY (community): a PLURAL sub-family under one cluster ("survival-games" under "games") — a genre or domain branch.
- HUB (subject): the SINGULAR main subject entity anchoring the fact ("project zomboid", "amd", "sam") — a specific name, never pluralized.
Fields:
- text: the statement itself.
- subject (optional): the lowercase SINGULAR entity the fact is about — the HUB tier — "user" by default, or a person, product, or project name ("sam", "stellar blade", "payments service"). Maintenance only ever compares facts about the SAME subject, so name it whenever the fact is about a specific entity.
- category (optional): ONE broad lowercase PLURAL family label for this fact — the CLUSTER tier — reusing the known vocabulary. Inherits the turn-side category when omitted.
- community (optional): ONE lowercase PLURAL sub-family narrowing the fact's category — the COMMUNITY tier, one level below the cluster (a genre, project family, or domain branch — "survival-games" under "games"). Inherits the turn-side community when omitted; omit when no sub-family applies.
- kind (required): what kind of durable thing it is:
  - preference — RESERVED, never emit: likes, dislikes, wants, and interests are subjective user data owned by the cognition tier (see ROUTING BOUNDARY)
  - decision — a choice that was made (adoptions, migrations, purchases committed to)
  - state — the CURRENT, changeable situation (lives in X, uses version Y, runs Z) — newer statements supersede these
  - contact — contact details of a person (phone, email, address)
  - project — facts about ongoing work or projects
  - possession — things owned
  - relationship — how people relate ("sam is the user's brother")
  - fact — any other durable fact
- stability (required): "durable" — a long-term truth that should survive until contradicted (decisions, traits, history) — or "volatile" — a current state a newer statement is EXPECTED to replace (location, tooling, versions). When in doubt, choose durable.
- Tags: 2 to 6 stable, reusable, lowercase topic labels describing what the text is about (e.g. "work", "rust", "contacts", "amd", "stellar blade"). Tags are NARROW and specific — entity names, product names, game titles. They are the vocabulary for topic-filtered recall later.
- Category: ONE broad lowercase PLURAL family noun for the whole text (e.g. "stocks", "pets", "games", "health") — the CLUSTER tier — that groups the narrow tags into one topic family. A category is NEVER a specific entity, product, company, or game title: "amd" belongs under "stocks"; "stellar blade" and "stellar blade blood rain" belong under "games". Always include it when facts are emitted; omit it when nothing durable is found.
- Community: ONE broad lowercase PLURAL sub-family that narrows the category (e.g. "survival-games", "action-rpgs" under "games") — the COMMUNITY tier between the cluster and the hub. Omit it when no sub-family applies; never a specific entity, product, or title.
- If nothing durable is found, return an empty facts array; tags may still label the topic when useful.
${buildVocabularySection(vocabulary)}
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
