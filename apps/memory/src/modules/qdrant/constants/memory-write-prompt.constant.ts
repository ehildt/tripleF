/**
 * Prompt for the memory-write queue job — runs after the turn was answered,
 * off the harness hot path, with the executed tool results summarized in the
 * job payload (the execute wave is blind: a memoryRemember call authored
 * there could never reflect the gathered data).
 *
 * Direction-based: WRITE only. Recall has already been probed in the execute
 * wave (memoryRecall), so this job NEVER calls memoryRecall — the probe's
 * hits arrive in PROBED THIS TURN so the write EXTENDS or UPDATES them
 * instead of duplicating.
 */
export const MEMORY_WRITE_INSTRUCTIONS = `MEMORY WRITE JOB — one purpose: decide whether THIS turn yielded facts worth persisting to YOUR long-term memory of the user, and store them via the memoryRemember tool.

You receive:
- USER REQUEST: what the user asked.
- PRIOR MEMORY: facts already stored for this user (may be empty).
- PROBED THIS TURN: what memoryRecall already surfaced for this turn (may be empty) — already known, never re-store.
- GATHERED DATA: summarized tool results from this turn (web searches, lookups).

Store a fact (call memoryRemember) only when it is durable and user-specific:
- A preference, interest, or durable detail the user states about themselves (favorite X, their setup, contact info, a decision — however phrased, any language).
- A notable fact the user asks you to track or remember.
- Knowledge about a subject the user cares about that was gathered this turn and extends what is already in PRIOR MEMORY.

STORAGE MECHANICS — how your memory works (write for the retriever):
- Each stored record is embedded as a whole AND matched sentence-by-sentence at recall time (multi-variant retrieval). One self-contained fact per call; a single long, dense sentence is fine, but lead with the subject ("Sam's phone number is 555-1234", never "His number is …").
- Restating a record verbatim OVERWRITES it in place — updates are restatements of the full corrected statement, not diffs.
- tags are the ONLY topic-filter vocabulary at recall — reuse stable, lowercase topics.
- Do not confuse fact records with your cognition profile: facts are statements the user made or asked you to remember; your own derived understanding of the user is learned separately.

Do NOT store:
- Public facts merely fetched this turn that do not relate to the user (e.g. generic web results).
- Anything already covered by PRIOR MEMORY or PROBED THIS TURN — extend or update it via the remember call; do not repeat.
- Tool artifacts: URLs, search scores, image metadata, raw JSON keys.
- Inferred, assumed, or extrapolated details about the user that neither their words nor GATHERED DATA support — if the user did not state it (or clearly imply it), it is not memory; when in doubt, answer "none".

Rules:
- Each memoryRemember call stores ONE self-contained statement (stand-alone, understandable weeks later without this conversation's context).
- Call memoryRemember once per distinct durable fact — no more.
- If nothing durable surfaced, produce a one-word text answer ("none") and make NO tool call. An empty memory write is a correct outcome, never a failure.`;

/**
 * Assembles the user-turn payload the write job reasons over. Truncation
 * keeps the job cheap: the model only needs salience cues to judge
 * durability, not the full fetch payloads.
 */
export function buildMemoryWritePrompt(params: {
  userRequest: string;
  priorMemory?: string;
  probedMemory?: string;
  gathered?: string;
}): string {
  return [
    `USER REQUEST: ${params.userRequest}`,
    `PRIOR MEMORY: ${params.priorMemory?.trim() || '(none stored yet)'}`,
    `PROBED THIS TURN: ${params.probedMemory?.trim() || '(nothing probed this turn)'}`,
    `GATHERED DATA: ${params.gathered?.trim() || '(no tools produced data this turn)'}`,
    MEMORY_WRITE_VERDICT,
  ].join('\n\n');
}

const MEMORY_WRITE_VERDICT =
  'Decide: store each durable user-specific fact with one memoryRemember call, or answer "none" if the turn surfaced nothing durable about this user.';
