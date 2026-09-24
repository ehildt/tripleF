import type { EvaluationComparisonColumn } from '../sections/evaluation-comparison-section/EvaluationComparisonSection.types';

/** Build one comparison column from a subject name. */
export function mapNameToColumn(
  name: string,
  winnerName: string | undefined,
): EvaluationComparisonColumn {
  return { name, winner: name === winnerName };
}
