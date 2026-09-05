import {
  type ExtractedFact,
  ExtractionSchema,
  type MemoryExtraction,
} from '@triplef/agent/schemas';
import { parseLlmJson } from '@triplef/helpers/parse-llm-json';

import { normalizeCategory } from './normalize-category.helper.js';
import { normalizeCommunity } from './normalize-community.helper.js';
import { normalizeSubject } from './normalize-subject.helper.js';
import { normalizeTags } from './normalize-tags.helper.js';

/**
 * Template glue for the vectorize extraction step (mirrors the harness's
 * parse-intent helper): tolerant LLM-JSON parse (markdown fences, single
 * quotes, unquoted keys, JSON5 fallback) → zod template validation →
 * normalization (facts trimmed and deduped by text; per-fact category and
 * subject normalized to their canonical labels; tags lowercased, deduped,
 * capped; turn-side category normalized to its canonical family label).
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

  const seen = new Set<string>();
  const facts: ExtractedFact[] = [];
  for (const fact of validated.data.facts) {
    const claim = fact.text.trim();
    if (!claim) continue;
    const key = claim.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    facts.push({
      ...fact,
      text: claim,
      subject: normalizeSubject(fact.subject),
      category: normalizeCategory(fact.category),
      community: normalizeCommunity(fact.community),
    });
  }

  return {
    facts,
    tags: normalizeTags(validated.data.tags),
    category: normalizeCategory(validated.data.category),
    community: normalizeCommunity(validated.data.community),
  };
}
