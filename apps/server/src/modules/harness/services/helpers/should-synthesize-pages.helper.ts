/**
 * Decide whether the server should synthesize page images for a pdf original.
 *
 * The client registers the pages it wants at select time and references them
 * in sessionMetadata.images. When at least one of the manifest's pages is
 * already referenced, the client's page selection is authoritative and no
 * additional pages are synthesized — a page the user dropped must stay
 * dropped. Only when none of the pages are referenced (legacy or broken
 * clients that never registered pages) does the server fall back to emitting
 * every page.
 */
export function shouldSynthesizePages(
  manifestPageHashes: string[],
  referencedHashes: ReadonlySet<string>,
): boolean {
  return !manifestPageHashes.some((hash) => referencedHashes.has(hash));
}
