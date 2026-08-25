import {
  ExtractionSchema,
  type MemoryExtraction,
} from '@triplef/agent/schemas';
import { parseLlmJson } from '@triplef/helpers/parse-llm-json';

import { normalizeCategory } from './normalize-category.helper.js';
import { normalizeTags } from './normalize-tags.helper.js';

/**
 * Template glue for the vectorize extraction step (mirrors the harness's
 * parse-intent helper): tolerant LLM-JSON parse (markdown fences, single
 * quotes, unquoted keys, JSON5 fallback) → zod template validation →
 * normalization (facts trimmed and deduped; tags lowercased, deduped, capped;
 * category normalized to its canonical family label). Throws a descriptive
 * error so the step can run its correction retry.
 */
export function parseExtraction(text: string): MemoryExtraction {
  if (!text.trim()) {
    throw new Error('Extraction returned empty output');
  }
  let parsed: unknown;
  try {
    parsed = parseLlmJson(text);
  } catch (parseError) {
    throw new Error(
      `Extraction JSON parse failed: ${
        parseError instanceof Error ? parseError.message : String(parseError)
      }`,
      { cause: parseError },
    );
  }
  const validated = ExtractionSchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error(
      `Extraction failed the schema: ${validated.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('; ')}`,
    );
  }
  return {
    facts: [
      ...new Set(
        validated.data.facts.map((fact) => fact.trim()).filter(Boolean),
      ),
    ],
    tags: normalizeTags(validated.data.tags),
    category: normalizeCategory(validated.data.category),
  };
}
