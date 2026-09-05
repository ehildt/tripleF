import { limitText } from '@triplef/helpers/limit-text';

import { MemoryClusterSummarySchema } from '../../schemas/memory/cluster-summary.schema.js';
import { buildStructuredPrompt } from '../helpers/build-structured-prompt.helper.js';

/**
 * Prompt for the memory-cluster queue job — after the link graph settles,
 * the model summarizes each detected cluster (a cluster of related memory
 * points) into a short title + summary. The summary is the cluster's
 * "report": the connective tissue that lets retrieval answer cross-cutting
 * questions ("what does this user care about overall?") without reading every
 * fact. Structured output enforced by contract: the job parses the answer
 * with the tolerant LLM-JSON parser and validates it against
 * MemoryClusterSummarySchema.
 */
export const MEMORY_CLUSTER_INSTRUCTIONS = buildStructuredPrompt(MemoryClusterSummarySchema, {
  before: `MEMORY CLUSTER SUMMARY — one purpose: write a short title + summary for ONE cluster of related memory records, so the cluster can be recalled as a whole without reading every member.

You receive:
- CATEGORY: the broad family label these records were filed under (may be absent).
- MEMBERS: the records in this cluster (each a single stored fact/statement).

Rules:
- The title is a short noun phrase (2–6 words) naming the cluster's shared theme — never a sentence, never a person's name alone.
- The summary is one or two sentences: what this cluster is about, the key facts it holds, and how they relate. Plain prose, third person, no markdown.
- Evidence only: summarize ONLY what the members state — never invent facts, never add outside knowledge, never editorialize.
- Never store secrets, credentials, or sensitive data.

OUTPUT FORMAT — output ONLY valid JSON:`,
  after: 'No markdown fences, no explanations.',
});

/**
 * Assembles the summarization payload for one cluster: its optional
 * category hint plus its member records (bounded by the caller — the job
 * caps members before calling).
 */
export function buildClusterSummaryPrompt(params: {
  category?: string;
  members: Array<{ text: string }>;
  maxPayloadChars?: number;
}): string {
  const members = params.members.map((member) => `- ${member.text}`).join('\n');
  return [
    `CATEGORY: ${params.category?.trim() || '(none)'}`,
    `MEMBERS:\n${limitText(members, params.maxPayloadChars)}`,
    'Write the title + summary JSON object now.',
  ].join('\n\n');
}
