/** The newest content hash among a url's stored chunks (by fetched_at). */
export function latestHash(
  existing: Array<{ contentHash: string; fetchedAt: string }>,
): string | undefined {
  if (existing.length === 0) return undefined;
  return existing.reduce((newest, chunk) =>
    chunk.fetchedAt > newest.fetchedAt ? chunk : newest,
  ).contentHash;
}
