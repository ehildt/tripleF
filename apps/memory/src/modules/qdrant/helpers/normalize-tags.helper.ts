const MAX_TAGS = 8;
const MAX_TAG_LENGTH = 40;

/**
 * Canonical form of an LLM-written tag bag: trimmed, lowercased, whitespace
 * collapsed, deduplicated, capped at {@link MAX_TAGS} labels of at most
 * {@link MAX_TAG_LENGTH} chars. Shared by the extraction parse and the relink
 * job's enrichment step so both write the same tag vocabulary.
 */
export function normalizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const tag of tags) {
    if (typeof tag !== 'string') continue;
    const clean = tag.trim().toLowerCase().replace(/\s+/g, ' ');
    if (!clean || clean.length > MAX_TAG_LENGTH) continue;
    if (seen.has(clean)) continue;
    seen.add(clean);
    normalized.push(clean);
    if (normalized.length >= MAX_TAGS) break;
  }
  return normalized;
}
