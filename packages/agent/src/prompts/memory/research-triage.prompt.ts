import { limitText } from '@triplef/helpers/limit-text';

import { ResearchTriageSchema } from '../../schemas/memory/research-triage.schema.js';
import { buildStructuredPrompt } from '../helpers/build-structured-prompt.helper.js';

/**
 * Prompt for the encyclopedia research job's triage step — the model reads
 * the gap candidates (search results the user's own searches surfaced but
 * that were never fetched) and decides which are worth closing into the
 * knowledge base, plus which follow-up topics the closed pages will likely
 * reference (the next deep-dive's search queries). Structured output
 * enforced by contract: the job parses the answer with the tolerant LLM-JSON
 * parser and validates it against ResearchTriageSchema.
 */
export const RESEARCH_TRIAGE_INSTRUCTIONS = buildStructuredPrompt(ResearchTriageSchema, {
  before: `ENCYCLOPEDIA RESEARCH TRIAGE — one purpose: decide which knowledge-base gaps to close and what to research next.

You receive a list of GAPS. Each gap is a search result the user's own past searches surfaced but whose page was never fetched into the knowledge base. For each gap you decide:
- close=true: the page is worth fetching and storing — substantive, durable knowledge (a spec, a how-to, a reference, a fact the user will likely need again). close=false: transient, duplicate, low-value, or already-covered content.
- followUpTopics: NEW topics the page will likely reference that the knowledge base does not yet cover — the next deep-dive's search queries. Empty when the page is self-contained. Never echo the gap's own subject back as a follow-up.

Rules:
- Judge from the snippet alone — you have not fetched the page yet.
- Prefer closing gaps that deepen a subject the user already researched; skip clickbait, ads, login walls, and pure navigation pages.
- followUpTopics are concrete search queries (2–8 words), at most 3 per gap.
- Never invent facts; the reason is one sentence of honest justification.

OUTPUT FORMAT — output ONLY valid JSON:`,
  after: 'No markdown fences, no explanations.',
});

/**
 * Assembles the triage payload: the gap candidates as a bounded JSON list.
 * The caller caps the gaps before calling (the job's gap limit).
 */
export function buildResearchTriagePrompt(
  gaps: Array<{ url: string; title?: string; snippet: string }>,
  maxPayloadChars?: number,
): string {
  const body = JSON.stringify(
    gaps.map((gap) => ({
      url: gap.url,
      title: gap.title ?? '(untitled)',
      snippet: gap.snippet,
    })),
  );
  return [`GAPS:\n${limitText(body, maxPayloadChars)}`, 'Write the decisions JSON object now.'].join('\n\n');
}
