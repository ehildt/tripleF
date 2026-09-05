import { TaxonomyPairVerdictSchema } from '../../schemas/memory/taxonomy-pair-verdict.schema.js';
import { buildStructuredPrompt } from '../helpers/build-structured-prompt.helper.js';

export const TAXONOMY_RECONCILE_INSTRUCTIONS = `TAXONOMY RECONCILIATION — one purpose: decide whether two EXISTING taxonomy labels of the same tier name the same concept and should merge into one.

The macro-taxonomy, top-down: CLUSTER (plural family, e.g. "games") → COMMUNITY (plural sub-family, e.g. "survival-games") → HUB (singular subject entity, e.g. "project zomboid") → plus TAG labels (narrow recall vocabulary).

Merge ONLY wording variants of one concept: casing/formatting drift ("Video Games" / "video-games"), singular/plural drift inside a family tier ("survival game" / "survival-games"), abbreviation with identical expansion ("nlp" / "natural-language-processing").
NEVER merge: two entities that merely share a word ("apple" the company vs "apple" the fruit), a parent and its child ("games" vs "survival-games"), a broad tier and a specific entity ("games" vs "project zomboid"), or two genuinely different topics that happen to look similar. When in doubt, answer DISTINCT — a missed merge is cleaned up later; a wrong merge destroys both labels' meaning forever.`;

/** One pair-adjudication prompt: the two labels plus their usage counts. */
export function buildTaxonomyPairPrompt(params: {
  kind: 'cluster' | 'community' | 'hub' | 'tag';
  labelA: string;
  labelB: string;
  countA: number;
  countB: number;
}): string {
  return `TIER: ${params.kind}
LABEL A: "${params.labelA}" (used by ${params.countA} records)
LABEL B: "${params.labelB}" (used by ${params.countB} records)

Decide: do these two labels name the SAME concept (merge) or are they DISTINCT (keep both)?`;
}

/**
 * Structured output contract + task for the pair verdict (kept for parity
 * with the other adjudication prompts; the caller drives the instructions
 * via TAXONOMY_RECONCILE_INSTRUCTIONS and the pair prompt above).
 */
export function buildTaxonomyReconcileSystemPrompt(): string {
  return buildStructuredPrompt(TaxonomyPairVerdictSchema, {
    before: `${TAXONOMY_RECONCILE_INSTRUCTIONS}\n\nOUTPUT FORMAT — output ONLY valid JSON matching this exact schema:`,
    after: `
RULES:
- Return ONLY a single valid JSON object matching the exact schema above.
- No markdown code fences, no explanations, preamble, or postscript.`,
  });
}
