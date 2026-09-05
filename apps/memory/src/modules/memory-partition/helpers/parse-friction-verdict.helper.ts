import { parseLlmJson } from '@triplef/helpers/parse-llm-json';

import {
  type FrictionVerdict,
  FrictionVerdictSchema,
} from './friction-verdict.schema.js';

/**
 * Tolerant parse + schema validation for the friction screen (mirrors the
 * consolidation adjudicator): LLM-JSON parse (markdown fences, single
 * quotes, unquoted keys, JSON5 fallback) → zod validation. Returns undefined
 * when the answer is unusable so the reflect job can defer the point to a
 * later run instead of burning retries on a deterministic failure.
 */
export function parseFrictionVerdict(
  text: string | undefined,
): FrictionVerdict | undefined {
  if (!text?.trim()) return undefined;
  try {
    const parsed = FrictionVerdictSchema.safeParse(parseLlmJson(text));
    if (!parsed.success) return undefined;
    // A contradiction must name the conflicting candidate; a winner must be
    // one of the two parties (the record's own id is validated by the caller).
    if (parsed.data.contradicts && !parsed.data.conflictingId) return undefined;
    return parsed.data;
  } catch {
    return undefined;
  }
}
