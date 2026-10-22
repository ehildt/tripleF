import {
  type ExtractedFact,
  ExtractionSchema,
  type MemoryExtraction,
} from '@triplef/agent/schemas';
import { parseLlmJson } from '@triplef/helpers/parse-llm-json';

import { normalizeCommunity } from '../../qdrant/helpers/normalize-community.helper.js';
import { normalizeNode } from '../../qdrant/helpers/normalize-node.helper.js';
import { normalizeSubject } from '../../qdrant/helpers/normalize-subject.helper.js';

import { normalizeCategory } from './normalize-category.helper.js';
import { normalizeTags } from './normalize-tags.helper.js';

/**
 * Template glue for the vectorize extraction step (mirrors the harness's
 * parse-intent helper): tolerant LLM-JSON parse (markdown fences, single
 * quotes, unquoted keys, JSON5 fallback) → zod template validation → the
 * verdict/facts consistency check (an inconsistent verdict is a descriptive
 * throw so the correction retry can teach it) → normalization (facts trimmed
 * and deduped by text; every label normalized to its canonical form; tags
 * lowercased, deduped, capped) — and the strict taxonomy chain: a fact
 * whose category/community/subject/node fails to survive normalization is
 * dropped (the schema already enforces presence). A `remember: false`
 * verdict short-circuits to an empty extraction without any normalization.
 * Throws a descriptive error so the step can run its correction retry.
 */
export function parseExtraction(text: string): MemoryExtraction {
  if (!text.trim()) {
    throw new Error('Extraction returned empty output');
  }
  // Bounded, single-line preview of the raw model output — parse/schema
  // failures are otherwise undiagnosable from the step's warn log alone (the
  // full text only survives as the correction attempt's assistant turn).
  const outputPreview = `'${text.replace(/\s+/g, ' ').trim().slice(0, 300)}'`;
  let parsed: unknown;
  try {
    parsed = parseLlmJson(text);
  } catch (parseError) {
    throw new Error(
      `Extraction JSON parse failed: ${
        parseError instanceof Error ? parseError.message : String(parseError)
      } — output: ${outputPreview}`,
      { cause: parseError },
    );
  }
  const validated = ExtractionSchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error(
      `Extraction failed the schema: ${validated.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('; ')} — output: ${outputPreview}`,
    );
  }

  // The verdict is authoritative and schema-enforced, but consistency is not:
  // a model can say remember=false and still attach facts (or the reverse).
  // Reject so the correction pass fixes the verdict instead of us guessing
  // which side it meant.
  const { remember, facts: rawFacts } = validated.data;
  if (remember !== rawFacts.length > 0)
    throw new Error(
      `verdict inconsistent: remember is ${remember} while ${rawFacts.length} fact(s) were provided — remember=true requires at least one fact, remember=false requires none`,
    );
  if (!remember) {
    // Unworthy turn-side: the complete, correct outcome — nothing else parsed.
    return { remember: false, facts: [], tags: [] };
  }

  const seen = new Set<string>();
  const facts: ExtractedFact[] = [];
  for (const fact of rawFacts) {
    const claim = fact.text.trim();
    if (!claim) continue;
    const key = claim.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const category = normalizeCategory(fact.category);
    const community = normalizeCommunity(fact.community);
    const subject = normalizeSubject(fact.subject);
    const node = normalizeNode(fact.node);
    // The strict taxonomy chain: a label that fails normalization (empty or
    // oversized) breaks the chain — the fact is dropped, not half-filed.
    if (!category || !community || !subject || !node) continue;
    facts.push({
      ...fact,
      text: claim,
      subject,
      node,
      category,
      community,
    });
  }

  return {
    remember: true,
    facts,
    tags: normalizeTags(validated.data.tags),
    category: normalizeCategory(validated.data.category),
    community: normalizeCommunity(validated.data.community),
  };
}
