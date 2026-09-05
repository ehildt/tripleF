import { parseLlmJson } from '@triplef/helpers/parse-llm-json';

import {
  type ConvictionSynthesis,
  ConvictionSynthesisSchema,
} from './conviction-synthesis.schema.js';

/** One validated synthesized statement: the claim text, its lane, plus its resolved evidence ids. */
interface ParsedConviction {
  text: string;
  target: 'conviction' | 'bridge';
  evidenceIds: string[];
}

/**
 * Tolerant parse + validation for the conviction-synthesis pass. Returns
 * `undefined` when the answer is unusable (empty / unparseable / schema
 * violation) so the job can leave the evidence synthesizable and retry on a
 * later run. On a valid verdict it maps each statement's ORDINAL evidence
 * citations to real point ids, dropping out-of-range indices, unsupported
 * (evidence-less) statements, and duplicate claim texts — the model
 * proposes, the system disposes.
 */
export function parseConvictionSynthesis(
  text: string | undefined,
  evidence: readonly { id: string }[],
  maxConvictions: number,
): ParsedConviction[] | undefined {
  if (!text?.trim()) return undefined;
  let parsed: ConvictionSynthesis;
  try {
    const result = ConvictionSynthesisSchema.safeParse(parseLlmJson(text));
    if (!result.success) return undefined;
    parsed = result.data;
  } catch {
    return undefined;
  }

  const seen = new Set<string>();
  const convictions: ParsedConviction[] = [];
  for (const conviction of parsed.convictions) {
    const claim = conviction.text.trim();
    if (!claim) continue;
    // Ordinal → real id; out-of-range citations are hallucinated and dropped.
    const evidenceIds = conviction.evidence
      .filter(
        (index) =>
          Number.isInteger(index) && index >= 0 && index < evidence.length,
      )
      .map((index) => evidence[index].id);
    // A statement with no surviving evidence is unsupported — drop it.
    if (evidenceIds.length === 0) continue;
    const key = claim.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    convictions.push({ text: claim, target: conviction.target, evidenceIds });
    if (convictions.length >= maxConvictions) break;
  }
  return convictions;
}
