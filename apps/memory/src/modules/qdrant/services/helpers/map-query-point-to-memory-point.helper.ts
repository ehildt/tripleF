/** Project a Qdrant query point into the memory-point shape. */
export function mapQueryPointToMemoryPoint(point: {
  id: unknown;
  score?: number;
  payload?: { category?: unknown; tags?: unknown };
}) {
  return {
    id: String(point.id),
    score: point.score ?? 0,
    category: point.payload?.category as string | undefined,
    tags: (point.payload?.tags as string[]) ?? [],
  };
}
