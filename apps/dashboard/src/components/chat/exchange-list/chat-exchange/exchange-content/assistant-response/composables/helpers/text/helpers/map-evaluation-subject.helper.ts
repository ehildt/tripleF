import type { KeyFinding } from '@/types/harness-response-data.model';

/** Normalize one evaluation subject profile from a raw record. */
export function mapEvaluationSubject(
  item: Record<string, unknown>,
  toOptionalString: (value: unknown) => string | undefined,
  normalizeKeyFindings: (value: unknown) => KeyFinding[] | undefined,
) {
  return {
    name: toOptionalString(item.name),
    description: toOptionalString(item.description),
    strengths: normalizeKeyFindings(item.strengths),
    weaknesses: normalizeKeyFindings(item.weaknesses),
    score: typeof item.score === 'number' ? item.score : undefined,
    scoreLabel: toOptionalString(item.scoreLabel),
  };
}
