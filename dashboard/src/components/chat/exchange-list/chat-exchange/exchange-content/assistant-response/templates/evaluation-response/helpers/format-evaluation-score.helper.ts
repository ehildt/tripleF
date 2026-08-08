/**
 * Format an evaluation score for display: prefer the model's human label,
 * otherwise append the fixed scale ("8/10").
 */
export function formatEvaluationScore(
  score?: number,
  scoreLabel?: string,
): string | undefined {
  const label = scoreLabel?.trim();
  if (label) return label;
  if (score === undefined) return undefined;
  return `${score}/10`;
}
