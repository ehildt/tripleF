/**
 * Greedy budget fill over score-sorted chunks: keep adding until the next
 * would exceed `budgetChars`. Returns the selected chunks and the omitted
 * count (chunks that fit the budget but were left out).
 */
export function fillChunkBudget<T extends { content: string }>(
  chunks: T[],
  budgetChars: number,
): { selected: T[]; omitted: number } {
  const selected: T[] = [];
  let used = 0;
  for (const chunk of chunks) {
    if (used + chunk.content.length > budgetChars) break;
    selected.push(chunk);
    used += chunk.content.length;
  }
  return { selected, omitted: chunks.length - selected.length };
}
