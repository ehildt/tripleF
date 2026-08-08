import type { IngestedImage } from '../media/download-and-ingest-images.types.js';
import type { ExtractedImageItem } from '../media/extract-media-from-tools.types.js';

/**
 * Walk candidates in their original order, rewriting externals to their
 * ingested storage URL and dropping externals without an ingested match
 * (never kept as fallback). Identical storage URLs collapse once.
 */
export function rewriteCandidatesWithIngested(
  candidates: ExtractedImageItem[],
  ingestedByUrl: Map<string, IngestedImage>,
): ExtractedImageItem[] {
  const rewritten: ExtractedImageItem[] = [];
  const seenUrls = new Set<string>();
  for (const item of candidates) {
    const isExternal = item.imageUrl.startsWith('http');
    const match = isExternal ? ingestedByUrl.get(item.imageUrl) : undefined;
    // Un-ingestable external images are dropped, never kept as fallback.
    if (isExternal && !match) continue;

    const finalUrl = match?.imageUrl ?? item.imageUrl;
    if (seenUrls.has(finalUrl)) continue;

    seenUrls.add(finalUrl);
    rewritten.push({
      ...item,
      imageUrl: finalUrl,
      title: match?.title ?? item.title,
      // Dimensions describe the stored (resized) image, not the origin —
      // clients badge tiles with them.
      width: match?.width ?? item.width,
      height: match?.height ?? item.height,
    });
  }
  return rewritten;
}
