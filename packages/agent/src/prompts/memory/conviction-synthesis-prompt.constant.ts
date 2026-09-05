import { formatFactMetadata } from './format-fact-metadata.helper.js';

/**
 * System instructions for the conviction-synthesis pass. The model
 * synthesizes durable, higher-level statements from a numbered list of
 * evidence facts — conclusions that are TRUE of the evidence but never
 * merely restated from it. Every statement picks its lane: `conviction`
 * (about the user/self model — the cognition lane) or `bridge` (closes a
 * gap between facts — the partition lane). Output is the
 * ConvictionSynthesis JSON contract.
 */
export const CONVICTION_INSTRUCTIONS = `You synthesize higher-level convictions and bridges from a user's memory facts.

Given a numbered list of EVIDENCE (facts the user stated or asked to remember), synthesize durable, higher-level statements — conclusions that are true of the evidence but not merely restated from it. Every statement picks its lane ("target"), and the choice is PURPOSE-based, never cosmetic:

- "conviction" — a durable conclusion about THE USER (or your own working relationship with them): a pattern in their behavior, a standing judgment the facts support, a trait or tendency you now hold true. Convictions deepen your understanding of the user and yourself; they are YOURS, never statements the user made. ("the user bought a dog" + "the user keeps comparing dog food brands" + "the user researches every purchase for days" → conviction: "the user is a deliberate, research-first buyer")
- "bridge" — a synthesized claim that CLOSES A GAP between facts: without it, two stored facts look unrelated; with it, they form one coherent story about the user's world. Bridges are the connective tissue of the fact graph. ("the user bought dog food X" + "the user's dog refuses to eat" → bridge: "the dog refuses the brand-X food the user bought")

A synthesized statement is a synthesis, not a restatement:
- combine multiple facts into one conclusion ("learning Rust" + "rewriting the payments service" → "the user is migrating the payments service to Rust")
- every statement MUST cite the evidence indices that support it (the [n] numbers)
- never invent facts not present in the evidence
- never restate a single evidence item verbatim — that is not synthesis
- a statement with no supporting evidence is invalid — omit it
- when neither a conviction nor a bridge clearly fits, emit nothing for it — a forced target blurs the lanes and is worse than no statement

EVIDENCE METADATA — each line may show "(subject: …; category: …; kind: …; stability: …)":
- subject groups the evidence lines about one entity — convictions about a subject cite that subject's lines
- durable evidence carries more weight for a conviction; a volatile state alone rarely supports a durable conclusion
- kind sharpens conclusions: a pattern of "preference" evidence supports a taste conclusion; "decision" evidence supports a commitment conclusion

Respond with JSON only:
{
  "convictions": [
    { "text": "one self-contained sentence", "target": "conviction", "evidence": [0, 2, 5] }
  ]
}

Rules:
- target is exactly "conviction" or "bridge" — every statement carries one
- evidence indices are the [n] numbers from the EVIDENCE list — never invent an index
- return an empty convictions array when the evidence is too thin to synthesize anything
- keep each statement to one sentence`;

/** One evidence line for the conviction-synthesis screen — id + text (+ classified metadata). */
interface ConvictionEvidenceItem {
  id: string;
  text: string;
  /** Broad category label — helps the model group related facts. */
  category?: string;
  /** The entity the record is about — groups evidence lines of one entity. */
  subject?: string;
  /** What kind of durable thing this is (preference, state, contact, …). */
  kind?: string;
  /** Whether a newer statement is expected to replace this one. */
  stability?: string;
}

/**
 * Build the user message for one conviction-synthesis run: the evidence
 * facts as a numbered list, each id-labeled by its ORDINAL position so the
 * verdict can cite `evidence` indices unambiguously (the parser maps
 * ordinals back to real point ids — the model never sees or emits raw ids).
 */
export function buildConvictionSynthesisPrompt(evidence: readonly ConvictionEvidenceItem[]): string {
  const lines: string[] = ['EVIDENCE (each item is a fact the user stated or asked to remember):'];
  for (const [index, item] of evidence.entries()) {
    lines.push(`[${index}] ${item.text}${formatFactMetadata(item)}`);
  }
  return lines.join('\n');
}
