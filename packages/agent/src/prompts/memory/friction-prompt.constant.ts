import { formatFactMetadata } from './format-fact-metadata.helper.js';

/**
 * System instructions for the reflection pass's friction screen. The model
 * judges whether one record CONTRADICTS any near-neighbor candidate — a
 * semantic conflict (negation, polarity flip, superseding update), never mere
 * redundancy (that is the consolidation pass's job). Each record carries the
 * classified metadata (subject / category / kind / stability) as the
 * interpretation knobs; records without metadata are judged by text alone.
 * Output is the FrictionVerdict JSON contract.
 */
export const FRICTION_INSTRUCTIONS = `You screen memory records for contradictions.

Given one RECORD and a list of CANDIDATES (near-neighbor records), decide whether the RECORD contradicts any CANDIDATE.

A contradiction is a genuine semantic conflict:
- a negation or polarity flip ("likes X" vs "dislikes X")
- a superseding update ("lives in Berlin" vs "moved to Munich")
- mutually exclusive claims about the same subject

NOT a contradiction:
- mere redundancy or restatement (that is handled elsewhere)
- different subjects or unrelated facts
- a more specific statement that does not actually conflict with a general one

METADATA — each record may show "(subject: …; category: …; kind: …; stability: …)":
- subject: a contradiction requires the SAME subject. Candidates about a different subject are never conflicts, however similar they read.
- stability: "volatile" records describe a current state — a NEWER volatile statement supersedes the older one (name the newer as winner). "durable" statements rarely supersede each other: when neither side is clearly right, omit winnerId so the conflict stays open.
- kind: polarity flips are the expected contradiction for "preference" and "relationship" records. For "fact", "project", "contact" and "possession" records a conflict means one statement is outdated or wrong — prefer the newer statement when the dates say which is current.
- category: conflicts almost always live inside one category family; treat a candidate from a clearly different family skeptically, but never dismiss it on category alone.

Respond with JSON only:
{
  "contradicts": boolean,
  "conflictingId": "the candidate id that conflicts (omit when contradicts is false)",
  "winnerId": "the id that is correct — the record's id or the conflictingId (omit when neither is clearly right)",
  "reason": "one sentence: the conflict, and why the winner wins when one is named"
}

Rules:
- Name a winner only when one side is clearly correct (e.g. the later statement supersedes the earlier). When both could be true or the truth is unclear, omit winnerId so the conflict stays open.
- Never invent a conflictingId or winnerId that is not in the input.`;

/** One record line for the friction screen — id + text (+ classified metadata + recency). */
export interface FrictionFact {
  id: string;
  text: string;
  /** ISO timestamp — helps the model prefer the newer statement on a tie. */
  createdAt?: string;
  /** The entity the record is about — conflicts require the same subject. */
  subject?: string;
  /** Broad family label — conflicts almost always live inside one family. */
  category?: string;
  /** What kind of durable thing this is (preference, state, contact, …). */
  kind?: string;
  /** Whether a newer statement is expected to replace this one. */
  stability?: string;
}

/**
 * Build the user message for one friction screen: the record under review
 * plus its near-neighbor candidates, each id-labeled so the verdict can name
 * a `conflictingId` / `winnerId` unambiguously.
 */
export function buildFrictionPrompt(input: { record: FrictionFact; candidates: FrictionFact[] }): string {
  const lines: string[] = [];
  lines.push(`RECORD (id: ${input.record.id})${formatFactMetadata(input.record)}:`);
  lines.push(input.record.text);
  if (input.record.createdAt) {
    lines.push(`(created: ${input.record.createdAt})`);
  }
  lines.push('');
  lines.push('CANDIDATES:');
  if (input.candidates.length === 0) {
    lines.push('(none)');
  } else {
    for (const candidate of input.candidates) {
      lines.push(`- id: ${candidate.id}${formatFactMetadata(candidate)}`);
      lines.push(`  text: ${candidate.text}`);
      if (candidate.createdAt) {
        lines.push(`  created: ${candidate.createdAt}`);
      }
    }
  }
  return lines.join('\n');
}
