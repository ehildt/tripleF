import { parseLlmJson } from '../../ai-sdk/helpers/parse-llm-json.helper.js';
import {
  ExtractionSchema,
  type MemoryExtraction,
} from '../templates/extraction.schema.js';

const MAX_TAGS = 8;
const MAX_TAG_LENGTH = 40;

function normalizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const tag of tags) {
    if (typeof tag !== 'string') continue;
    const clean = tag.trim().toLowerCase().replace(/\s+/g, ' ');
    if (!clean || clean.length > MAX_TAG_LENGTH) continue;
    if (seen.has(clean)) continue;
    seen.add(clean);
    normalized.push(clean);
    if (normalized.length >= MAX_TAGS) break;
  }
  return normalized;
}

/**
 * Template glue for the vectorize extraction step (mirrors the harness's
 * parse-intent helper): tolerant LLM-JSON parse (markdown fences, single
 * quotes, unquoted keys, JSON5 fallback) → zod template validation →
 * normalization (facts trimmed and deduped; tags lowercased, deduped, capped).
 * Throws a descriptive error so the step can run its correction retry.
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
  };
}
