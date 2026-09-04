/**
 * The page indexes (0-based, manifest order) a pdf original is processed for
 * in this turn. The client's gallery selection is authoritative: when at
 * least one page hash is referenced, exactly those pages are selected
 * (dropped pages stay dropped). When NO page is referenced at all the client
 * is a legacy/bootstrap one that never registered page tiles — fall back to
 * every page (same semantics as shouldSynthesizePages).
 */
export function resolveSelectedPageIndexes(
  pageHashes: string[],
  referencedImageHashes: ReadonlySet<string>,
): number[] {
  const selected = pageHashes.flatMap((hash, index) =>
    referencedImageHashes.has(hash) ? [index] : [],
  );
  if (selected.length) return selected;
  return pageHashes.map((_, index) => index);
}
