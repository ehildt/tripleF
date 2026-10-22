import type { EvaluationCriterionScore } from '@/types/assistant-response-data.model';

/** Normalize one evaluation criterion from a raw record. */
export function mapEvaluationCriterion(
  item: Record<string, unknown>,
  toOptionalString: (value: unknown) => string | undefined,
  normalizeCriterionScores: (
    value: unknown,
  ) => EvaluationCriterionScore[] | undefined,
) {
  return {
    name: toOptionalString(item.name),
    scores: normalizeCriterionScores(item.scores),
  };
}
