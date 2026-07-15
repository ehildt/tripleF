import type { GalleryItem } from './build-gallery-items.helper.js';

function extractHashFromUrl(url: string): string | undefined {
  if (!url) return undefined;
  const lastSlash = url.lastIndexOf('/');
  if (lastSlash === -1) return undefined;
  return url.slice(lastSlash + 1).split('?')[0];
}

export function dedupeGalleryItems(items: GalleryItem[]): GalleryItem[] {
  const seenHashes = new Set<string>();
  const seenUrls = new Set<string>();

  return items.filter((item) => {
    const url = item.imageUrl;
    if (!url || seenUrls.has(url)) return false;

    const hash = extractHashFromUrl(url);
    if (hash) {
      if (seenHashes.has(hash)) return false;
      seenHashes.add(hash);
    }

    seenUrls.add(url);
    return true;
  });
}
