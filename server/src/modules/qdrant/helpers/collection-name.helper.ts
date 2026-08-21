const MAX_SLUG_LENGTH = 60;

/**
 * The Qdrant collection is namespaced by the embedding model that wrote it
 * (`{base}_{model}`). Embedding models produce model-specific vector spaces —
 * vectors from two models are not comparable even at identical dimensions — so
 * switching `QDRANT_EMBED_MODEL` must yield a fresh, uncorrupted collection
 * instead of silently mixing spaces. The old collection stays wipeable.
 */
export function buildCollectionName(base: string, embedModel: string): string {
  const slug = embedModel
    .toLowerCase()
    // Qdrant collection names allow alphanumerics, `_`, `-`, `.` only.
    .replace(/[^a-z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, MAX_SLUG_LENGTH);
  return slug ? `${base}_${slug}` : base;
}
