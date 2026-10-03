import type { Exchange } from '@/stores/conversation';

import type { BuildMergedPromptOptions } from './build-merged-prompt.helper.types';
import { toMergeMaterial } from './to-merge-material.helper';

/**
 * Build the single user message that carries a merge request to the harness.
 *
 * The selected exchanges (both roles, chronological) are embedded as a
 * numbered document — each part tagged with its request id — so the model
 * can consolidate them: same-topic material collapses into merged snippets,
 * unrelated topics stay distinct. The leading [MERGE REQUEST] marker lets
 * the intent classifier deterministically pick the merge template instead
 * of latching onto the embedded content. Any text typed into the prompt bar
 * travels as an additional instruction.
 */
export function buildMergedPromptContent(
  exchanges: readonly Exchange[],
  options: BuildMergedPromptOptions = {},
): string {
  const sections = exchanges
    .map((exchange, index) => {
      const roleLabel =
        exchange.role === 'user' ? 'USER REQUEST' : 'ASSISTANT ANSWER';
      const idLabel = exchange.requestId
        ? ` (request id: ${exchange.requestId})`
        : '';
      return `[${index + 1}] ${roleLabel}${idLabel}:\n${toMergeMaterial(exchange)}`;
    })
    .join('\n\n');

  const extraInstruction = options.extraInstruction?.trim();
  const instruction = extraInstruction
    ? `\n\nADDITIONAL INSTRUCTION:\n${extraInstruction}`
    : '';

  return `[MERGE REQUEST]\nThe user combined the following previous requests and answers from this conversation into a single request. Each ASSISTANT ANSWER carries the original response as its full structured JSON — the exact snippet fields it was rendered from. Respond with template "merge" — merge those snippet fields into NEW enriched JSON (merged evaluation blocks per match-up, merged video gallery, merged image gallery, merged sources, merged body text). Never copy an embedded JSON verbatim. Do NOT use the summary, text, videolist, or imagelist templates.\n\n${sections}${instruction}`;
}
