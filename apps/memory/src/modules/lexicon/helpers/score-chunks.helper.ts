/**
 * Cosine similarity between a query vector and each chunk vector. The
 * EmbeddingService returns L2-normalized vectors, so cosine = dot product.
 */
export function cosineScores(
  queryVector: number[],
  chunkVectors: number[][],
): number[] {
  return chunkVectors.map((vector) => dotProduct(queryVector, vector));
}

function dotProduct(a: number[], b: number[]): number {
  return a.reduce((sum, value, index) => sum + value * (b[index] ?? 0), 0);
}
