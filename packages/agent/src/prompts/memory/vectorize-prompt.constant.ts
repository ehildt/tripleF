import { formatZodShape } from '../../schemas/helpers/zod/format-zod-shape.helper.js';
import { ExtractionSchema } from '../../schemas/memory/extraction.schema.js';
import { buildStructuredPrompt } from '../helpers/build-structured-prompt.helper.js';

import type { ExtractionSourceRole } from './vectorize-prompt.types.js';
import { buildVocabularySection } from './vocabulary-section.helper.js';
import type { TaxonomyVocabulary } from './vocabulary-section.types.js';

/** Static prompt strings for the vectorize extraction LLM step. */

/**
 * Voice framing for the extraction source. The queue enqueues one job per
 * turn-side; without this the extractor treats every source as the user's
 * voice and stores the assistant's own opinions as user facts.
 */
const USER_SOURCE_VOICE_RULES = `SOURCE VOICE: this extraction source is the USER's own message — statements in it are the user's voice and may be attributed to the user.`;

const ASSISTANT_SOURCE_VOICE_RULES = `SOURCE VOICE (absolute): this extraction source is the ASSISTANT's own generated answer — a flattened digest of its titles, verdicts, and findings — NOT the user's words.
- First-person statements, verdicts, scores, recommendations, and "my take" phrasing are the ASSISTANT's voice. NEVER attribute them to the user: no fact of the form "the user thinks / describes / wants / would / decided …" may be drawn from this source.
- The assistant's opinions, judgments, verdicts, and recommendations are NOT durable objective facts — never extract them. When the source only conveys the assistant's opinion, return remember=false.
- Extract only objective, checkable world facts the answer asserts, with the subject ENTITY as the hub — never "user" as the subject of assistant-voice content.
- Statements about reception or coverage keep their true source ("available coverage of X notes …"), never "the user";`;

/**
 * Structured output contract + task for the extraction model. The schema is
 * derived from the zod template (templates/extraction.schema.ts — the typed
 * truth), followed by the task rules and a final reminder. Verdict-first:
 * the model commits `remember` before it writes a single record, so an
 * unworthy turn-side is an explicit, complete outcome instead of a fact the
 * model felt obliged to invent. When the caller passes the partition's
 * taxonomy vocabulary (ranked by relevance to the source text), it is
 * appended as a reuse-first hint so the model extends the taxonomy instead
 * of minting near-duplicate labels.
 */
export function buildExtractionPrompt(
  vocabulary: TaxonomyVocabulary = {},
  role: ExtractionSourceRole = 'user',
): string {
  const sourceVoiceRules = role === 'assistant' ? ASSISTANT_SOURCE_VOICE_RULES : USER_SOURCE_VOICE_RULES;
  return buildStructuredPrompt(ExtractionSchema, {
    before: 'OUTPUT FORMAT — output ONLY valid JSON matching this exact schema:',
    after: `
YOUR TASK — decide FIRST whether this text is worth long-term memory, then distill:
- VERDICT FIRST (absolute): "remember" is the gate, and it comes first. Set remember=false whenever the text carries nothing worth recalling in a later, unrelated conversation — greetings, small talk, filler, questions that were merely answered, one-off requests. Most ordinary turns are remember=false. When remember=false, facts, tags, category, and community are ALL empty; remember=true REQUIRES at least one fact.
- ONE-OFF REQUESTS ARE NEVER FACTS: a task the user asks the assistant to do right now ("find X", "play Y", "summarize Z") is the current request, not knowledge about anyone. Never emit facts of the form "the user wants to find / watch / buy / do …" — from "find japanese dark trap music by katame on youtube" there is nothing to store, period. A STANDING preference or interest the request reveals ("the user is into japanese dark trap") is subjective user data — never emitted here either (see ROUTING BOUNDARY).
- ROUTING BOUNDARY (absolute): this extraction feeds the memory partition — the OBJECTIVE fact store ONLY. Extract only objective, external-world facts and events: factual records, project details, decisions, states, possessions, contacts, relationships between people. You MUST NOT extract subjective user data — no preferences, likes/dislikes, interests, wants, behavioral traits, or internal states ("the user likes…", "the user is interested in…", "the user prefers…"). All user profile and persona data is deferred to the cognition tier; when the turn reveals ONLY subjective user data, return remember=false.
- What IS worth remembering: durable, objective information that remains useful in a later, unrelated conversation — decisions, contact details, project facts, technical constraints, events (e.g. "Sam's phone number is 555-1234", "The user is building a vector memory feature", "The payments service migrated to PostgreSQL in November").
- DROP-BIAS (absolute): when in doubt whether a detail is durable, DROP it. A worthless record pollutes the fact store, the taxonomy, and every future recall; a detail that truly matters will be re-stated another day. Extracting nothing is always better than extracting noise.
- Facts must be self-contained — no "this"/"that" references; write them as third-person statements.
- Storage mechanics: each fact is embedded as a whole and matched sentence-by-sentence at recall time (multi-variant retrieval). One dense sentence is fine — put the subject up front ("The payments service runs PostgreSQL 16", not "It runs that version").
${sourceVoiceRules}
- GATHERED DATA (when the source text is followed by a "GATHERED DATA" section — this turn's tool results): durable knowledge about subjects the USER cares about may be distilled from it ("Katame is a japanese dark-trap producer releasing on YouTube" counts only when the turn shows the user tracks that artist). Never store tool artifacts — URLs, search scores, image metadata, raw JSON keys — and never store public trivia unrelated to the user's subjects.
- ATTACHED FILES (when an "ATTACHED FILES" section lists this turn's uploads): distill what a file durably IS when the turn reveals it ("bauplan.pdf is the floor plan for the user's garage conversion") — never the mere act of uploading, never bare file metadata.

FACT METADATA — every fact object carries the fields the maintenance passes (consolidate/reflect/conviction) interpret. Labels place the fact in the macro-taxonomy, top-down: CLUSTER → COMMUNITY → HUB → NODE → LEAF, where the LEAF is the fact's text itself and every tier above it is a NAMED label that narrows where it is filed. The chain is strict: a fact is emitted with ALL FOUR labels or not at all.
- CLUSTER (category): a broad PLURAL family noun ("games", "stocks", "pets").
- COMMUNITY (community): a PLURAL sub-family under one cluster ("survival-games" under "games") — a genre or domain branch.
- HUB (subject): the SINGULAR main subject entity anchoring the fact ("project zomboid", "amd", "sam") — a specific name, never pluralized.
- NODE (node): the SINGULAR aspect under the hub that the fact addresses ("base building" under "project zomboid", "ryzen 9950x3d" under "amd") — a specific sub-entity or topic branch, never pluralized, never a sentence.
PERSONA & FICTION CONTENT (absolute): facts about an adopted persona, a roleplay, or a fictional/entertainment work classify by the content's real-world MEDIUM, never by its in-universe domains. A TV persona's biography, family, career, or studies are NOT real-world walk-of-life categories — never "family", "education", "business", or "science" for invented content: the cluster is the medium family (e.g. "shows"), the community a true plural sub-family (e.g. "tv-shows"), and the show's title goes to the hub or the tags ("breaking bad"), never to the community.
Fields:
- text: the statement itself.
- subject (required): the lowercase SINGULAR entity the fact is about — the HUB tier — a person, product, project, or the user's own name ("sam", "stellar blade", "payments service"). Maintenance only ever compares facts about the SAME subject, so name it whenever the fact is about a specific entity.
- node (required): the lowercase SINGULAR aspect of the fact under its hub — the NODE tier — ("base building", "ryzen 9950x3d", "vocal range"). Reuse the known vocabulary rather than minting near-variants.
- category (required): ONE broad lowercase PLURAL family label for this fact — the CLUSTER tier — reusing the known vocabulary.
- community (required): ONE broad lowercase PLURAL sub-family narrowing the fact's category — the COMMUNITY tier, one level below the cluster (a genre, project family, or domain branch — "survival-games" under "games").
- kind (required): what kind of durable thing it is:
  - decision — a choice that was made (adoptions, migrations, purchases committed to)
  - state — the CURRENT, changeable situation (lives in X, uses version Y, runs Z) — newer statements supersede these
  - contact — contact details of a person (phone, email, address)
  - project — facts about ongoing work or projects
  - possession — things owned
  - relationship — how people relate ("sam is the user's brother")
  - fact — any other durable fact
- stability (required): "durable" — a long-term truth that should survive until contradicted (decisions, traits, history) — or "volatile" — a current state a newer statement is EXPECTED to replace (location, tooling, versions). When in doubt, choose durable.
- Tags: 2 to 6 stable, reusable, lowercase topic labels describing what the text is about (e.g. "work", "rust", "contacts", "amd", "stellar blade"). Tags are NARROW and specific — entity names, product names, game titles. They are the vocabulary for topic-filtered recall later. Only when remember=true.
- Category: ONE broad lowercase PLURAL family noun for the whole text (e.g. "stocks", "pets", "games", "health") — the CLUSTER tier — that groups the narrow tags into one topic family. A category is NEVER a specific entity, product, company, or game title: "amd" belongs under "stocks"; "stellar blade" and "stellar blade blood rain" belong under "games". Persona/fictional content follows the PERSONA & FICTION rule above (medium family, not in-universe domains). Only when remember=true.
- Community: ONE broad lowercase PLURAL sub-family that narrows the category (e.g. "survival-games", "action-rpgs" under "games"; "tv-shows" under "shows") — the COMMUNITY tier between the cluster and the hub. Never a specific entity, product, or title — a show/work title like "breaking-bad" is a tag or hub, never a community. Only when remember=true.
${buildVocabularySection(vocabulary)}
PRIOR MEMORY (when the source text ends with an "ALREADY STORED IN MEMORY" section):
- That section lists facts already stored in YOUR long-term memory from prior turns. NEVER emit a fact already covered there.
- If this turn refines, corrects, or completes a stored fact, DO emit it — as one fuller, self-contained restatement (a full restatement of the corrected claim overwrites the old record in place; it is never a diff).
- A statement that flips or adds negation to a stored fact is NEW information — always emit it.
- Everything not covered by the section is judged as usual.

RULES:
- Return ONLY a single valid JSON object matching the exact schema above.
- The "remember" boolean is always present and consistent with the output: false exactly when facts is empty, true exactly when it is not — and when false, tags, category, and community are empty too.
- No markdown code fences, no explanations, preamble, or postscript.
- Never output undefined or null. The "remember" and "facts" keys are always present.

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
All object keys must be quoted with double quotes. "remember" is always required and must be true exactly when facts is non-empty, false when it is empty. Per fact, "subject", "node", "category", and "community" are required alongside "kind" and "stability".
Do not add markdown code fences, explanations, placeholders, or extra text.

FINAL REMINDER:
- Return ONLY a single valid JSON object. No markdown code fences, no explanations, no extra text.`;
}
