import { ConsolidationVerdictSchema } from '../../schemas/index.js';
import { buildStructuredPrompt } from '../helpers/build-structured-prompt.helper.js';

/**
 * Prompt for the memory-consolidate queue job — adjudicates pending ledger
 * inserts against their near-duplicate candidates with LLM verdicts
 * {keep, redundant, merge}. LLM-judged only: cosine thresholds cannot see
 * negation/polarity flips, so geometric merges are never used.
 */
export const MEMORY_CONSOLIDATE_INSTRUCTIONS = buildStructuredPrompt(ConsolidationVerdictSchema, {
  before: `MEMORY CONSOLIDATION — one purpose: decide whether a NEW FACT stored this sweep window is already covered by EXISTING CANDIDATES from the same memory space, and resolve redundancy without losing information or provenance.

You receive:
- NEW FACT: the freshly stored record (with origin and date).
- EXISTING CANDIDATES: near-duplicate records already stored (each with origin and date).

Decide exactly one verdict:
- keep — the new fact carries information no candidate covers (new detail, new specificity, newer state, different polarity). Store it alongside.
- redundant — the new fact is fully covered by a candidate (same claim, paraphrase, same polarity, no new detail). The new record will be deleted; the original stays.
- merge — the new fact refines, corrects, or completes a candidate. Write mergedText: ONE fuller, self-contained statement combining them (full restatement, never a diff). Lead with the subject. Preserve names, numbers, and dates.

POLARITY RULE (ABSOLUTE): a flip or addition of negation ("allergic" vs "not allergic", "likes" vs "dislikes") is NEW information — it is never "redundant"; if it corrects a stored statement, merge with the corrected statement.
PROVENANCE RULE (ABSOLUTE): a statement the user made outweighs assistant-derived wording — mergedText preserves the user's claim; when candidate origins conflict on facts, the user's version wins.

OUTPUT FORMAT — output ONLY valid JSON:`,
  after: 'No markdown fences, no explanations. mergedText is required with verdict "merge" and omitted otherwise.',
});

/** One provenance-labeled record line — the adjudication input. */
interface ConsolidateProvenanceLine {
  text: string;
  role: string;
  createdAt?: string;
}

function renderLine(line: ConsolidateProvenanceLine): string {
  const who = line.role === 'user' ? 'the user' : 'you (assistant)';
  const when = line.createdAt ? ` on ${new Date(line.createdAt).toISOString().slice(0, 10)}` : '';
  return `"${line.text}" — stated by ${who}${when}`;
}

/**
 * Assembles the adjudication payload: the new fact plus its near-duplicate
 * candidates, each provenance-labeled, and the closing verdict instruction.
 */
export function buildConsolidatePrompt(params: {
  newFact: ConsolidateProvenanceLine;
  candidates: ConsolidateProvenanceLine[];
}): string {
  const candidates = params.candidates.length
    ? params.candidates.map((c) => `- ${renderLine(c)}`).join('\n')
    : '(none)';
  return [
    `NEW FACT:\n- ${renderLine(params.newFact)}`,
    `EXISTING CANDIDATES:\n${candidates}`,
    'Decide exactly one verdict (keep / redundant / merge) and output ONLY the JSON object.',
  ].join('\n\n');
}
