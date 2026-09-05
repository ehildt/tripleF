import { buildVocabularySection } from './vocabulary-section.helper.js';

/**
 * Prompt for the memory-write queue job — runs after the turn was answered,
 * off the harness hot path, with the executed tool results summarized in the
 * job payload (the execute wave is blind: a remember call authored there
 * could never reflect the gathered data).
 *
 * Direction-based: WRITE only. Recall has already been probed in the execute
 * wave (memory-partition-recall), so this job NEVER calls recall — the
 * probe's hits arrive in PROBED THIS TURN so the write EXTENDS or UPDATES
 * them instead of duplicating.
 */
export const MEMORY_WRITE_INSTRUCTIONS = `MEMORY WRITE JOB — one purpose: decide whether THIS turn yielded anything worth persisting, and store it in the correct lane via the memory-partition-remember or memory-cognition-remember tool.

Two lanes, never confused:
- memory-partition = the OBJECTIVE fact store: external-world facts, factual records, project details, and events the user stated, subjects gathered this turn, or facts the user asked you to remember.
- memory-cognition = the SUBJECTIVE profile store: every preference, interest, trait, or internal state of the user (stated or inferred) — YOUR understanding of the user, persona learnings included.

You receive:
- USER REQUEST: what the user asked.
- PRIOR MEMORY: facts already stored for this user (may be empty).
- PROBED THIS TURN: what memory-partition-recall already surfaced for this turn (may be empty) — already known, never re-store.
- GATHERED DATA: summarized tool results from this turn (web searches, lookups).

Store into the PARTITION lane (call memory-partition-remember) only when it is durable, objective, and user-specific:
- A factual record the user states or asks you to track (contact info, a decision, a project detail, an event, their setup — however phrased, any language).
- Knowledge about a subject the user cares about that was gathered this turn and extends what is already in PRIOR MEMORY.

ROUTING CONSTRAINT (absolute): extract ONLY objective, external facts to the partition. You MUST NOT store user preferences, behavioral traits, or internal states there ("the user likes…", "the user is interested in…", "the user prefers…"). All user profile and persona data is deferred to the cognition tier.

Store into the COGNITION lane (call memory-cognition-remember) whenever the turn yields SUBJECTIVE user data, stated or derived:
- A preference or interest the user states outright (favorite X, a like or dislike, a style choice) — stated preferences live HERE, never in the partition.
- An inferred trait, a standing interest, a working nuance, or a connection between facts the turn supports.
- Never an objective fact — those belong in the partition lane.

STORAGE MECHANICS — how your memory works (write for the retriever):
- Each stored record is embedded as a whole AND matched sentence-by-sentence at recall time (multi-variant retrieval). One self-contained fact per call; a single long, dense sentence is fine, but lead with the subject ("Sam's phone number is 555-1234", never "His number is …").
- Restating a record verbatim OVERWRITES it in place — updates are restatements of the full corrected statement, not diffs.
- tags are the ONLY topic-filter vocabulary at recall — reuse stable, lowercase topic labels (partition lane only). Tags are NARROW and specific: entity names, product names, game titles ("amd", "stellar blade", "stellar blade blood rain").
- category is the broad family the fact belongs to (partition lane only): ONE lowercase PLURAL family noun per remember call — stocks, games, pets, work, health, finance, contacts … — chosen so narrow topics group into families. A category is NEVER a specific entity, product, company, or game title: "amd" is a tag under the category "stocks"; "stellar blade" and "stellar blade blood rain" are tags under the category "games". Always include it; tags stay narrow, category stays broad and plural.

Do NOT store:
- Public facts merely fetched this turn that do not relate to the user (e.g. generic web results).
- Anything already covered by PRIOR MEMORY or PROBED THIS TURN — extend or update it via the remember call; do not repeat.
- Tool artifacts: URLs, search scores, image metadata, raw JSON keys.
- Inferred, assumed, or extrapolated details about the user that neither their words nor GATHERED DATA support — if the user did not state it (or clearly imply it), it is not memory; when in doubt, answer "none".

Rules:
- Each remember call stores ONE self-contained statement (stand-alone, understandable weeks later without this conversation's context).
- Call each remember tool once per distinct durable item — no more.
- If nothing durable surfaced, produce a one-word text answer ("none") and make NO tool call. An empty memory write is a correct outcome, never a failure.`;

/**
 * Assembles the user-turn payload the write job reasons over. Truncation
 * keeps the job cheap: the model only needs salience cues to judge
 * durability, not the full fetch payloads. When the caller passes the
 * partition's existing category/tag vocabulary, it is appended as a
 * reuse-first hint so the model extends the taxonomy instead of minting
 * near-duplicate labels.
 */
export function buildMemoryWritePrompt(params: {
  userRequest: string;
  priorMemory?: string;
  probedMemory?: string;
  gathered?: string;
  knownCategories?: string[];
  knownTags?: string[];
}): string {
  const vocabulary = buildVocabularySection(params.knownCategories, params.knownTags);
  return [
    `USER REQUEST: ${params.userRequest}`,
    `PRIOR MEMORY: ${params.priorMemory?.trim() || '(none stored yet)'}`,
    `PROBED THIS TURN: ${params.probedMemory?.trim() || '(nothing probed this turn)'}`,
    `GATHERED DATA: ${params.gathered?.trim() || '(no tools produced data this turn)'}`,
    vocabulary,
    MEMORY_WRITE_VERDICT,
  ]
    .filter(Boolean)
    .join('\n\n');
}

const MEMORY_WRITE_VERDICT =
  'Decide: store each durable objective fact with one memory-partition-remember call, each subjective user datum (stated or derived) with one memory-cognition-remember call, or answer "none" if the turn surfaced nothing durable about this user.';
