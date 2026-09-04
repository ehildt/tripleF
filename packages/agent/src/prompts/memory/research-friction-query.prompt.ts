import { limitText } from '@triplef/helpers/limit-text';

import { ResearchFrictionQuerySchema } from '../../schemas/memory/research-friction-query.schema.js';
import { buildStructuredPrompt } from '../helpers/build-structured-prompt.helper.js';

/**
 * Prompt for the research job's contested-memory step: the model reads the
 * open frictions (pairs of statements the reflection sweep flagged as
 * contradictory) and decides which disputes a web search can actually settle,
 * formulating the single resolution-seeking query per checkable contest. The
 * fetched evidence lands in the encyclopedia; the reflection cycle — not
 * this job — then settles the friction with ground truth.
 */
export const RESEARCH_FRICTION_QUERY_INSTRUCTIONS = buildStructuredPrompt(ResearchFrictionQuerySchema, {
  before: `CONTESTED-MEMORY QUERY FORMULATION — one purpose: decide which contradictions external evidence can settle, and formulate the search that would fetch it.

You receive a list of CONTESTS. Each contest is a pair of statements the memory flagged as contradictory, plus a reason describing the conflict. For each contest decide:
- checkable=true: the dispute is about publicly verifiable facts (a spec, a version, a date, an event, a property of the world) — an authoritative source exists that can settle it. Then provide query: ONE resolution-seeking search query (2–8 words) that would fetch decisive evidence.
- checkable=false: the dispute is subjective or user-specific (taste, personal situations, private arrangements) — no web page settles it. Omit query.

Rules:
- Word the query to fetch decisive evidence, not just to restate the claim.
- At most one query per contest.
- Judge checkability strictly: only a genuine public source counts (docs, spec, release notes, reference) — opinion pieces do not settle a contradiction.
- Never invent the answer; you are only formulating the search.

OUTPUT FORMAT — output ONLY valid JSON:`,
  after: 'No markdown fences, no explanations.',
});

/**
 * Assembles the contested-memory payload: the open frictions as a bounded
 * JSON list of statement pairs. The caller caps the frictions before calling
 * (the job's friction limit).
 */
export function buildResearchFrictionQueryPrompt(
  contests: Array<{
    id: string;
    statementA: string;
    statementB: string;
    reason?: string;
  }>,
  maxPayloadChars?: number,
): string {
  const body = JSON.stringify(
    contests.map((contest) => ({
      id: contest.id,
      statementA: contest.statementA,
      statementB: contest.statementB,
      reason: contest.reason ?? '(no reason recorded)',
    })),
  );
  return [`CONTESTS:\n${limitText(body, maxPayloadChars)}`, 'Write the decisions JSON object now.'].join('\n\n');
}
