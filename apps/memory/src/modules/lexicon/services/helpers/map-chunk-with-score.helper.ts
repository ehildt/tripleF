/** Stamp an ephemeral chunk with its cosine score. */
export function mapChunkWithScore<T>(
  chunk: T,
  index: number,
  scores: number[],
) {
  return { ...chunk, score: scores[index] ?? 0 };
}
