/** Normalize one criterion score entry from a raw record. */
export function mapCriterionScore(
  item: Record<string, unknown>,
  toOptionalString: (value: unknown) => string | undefined,
) {
  return {
    subject: toOptionalString(item.subject),
    score: typeof item.score === 'number' ? item.score : undefined,
  };
}
