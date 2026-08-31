import type { EvaluationComparisonCell } from '../sections/evaluation-comparison-section/EvaluationComparisonSection.types';

/** Build one comparison cell from a column and its score. */
export function mapColumnToCell(
  column: string,
  scores: Map<string, number>,
  winnerName: string | undefined,
): EvaluationComparisonCell {
  const score = scores.get(column);
  return {
    column,
    text: score !== undefined ? String(score) : '—',
    winner: column === winnerName,
  };
}
