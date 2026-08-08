import type { GalleryItem } from '../media/build-gallery-items.helper.js';
import { dedupeGalleryItems } from '../media/dedupe-gallery-items.helper.js';
import { extractStorageHash } from '../media/extract-storage-hash.helper.js';

/**
 * Merge uploaded local images into the response gallery, dropping any that
 * already appear (by storage hash) and any tile that repeats the hero image.
 */
export function mergeLocalImagesIntoResponseData(
  data: Record<string, unknown> | undefined,
  galleryItems: GalleryItem[],
): Record<string, unknown> | undefined {
  if (!data) return data;

  const existingHashes = new Set<string>(
    ((data.galleryItems as GalleryItem[]) ?? [])
      .filter((item): item is GalleryItem => typeof item?.imageUrl === 'string')
      .map((item) => extractStorageHash(item.imageUrl))
      .filter((hash): hash is string => !!hash),
  );

  const missingLocal = galleryItems
    .filter((item) => item.source === 'local')
    .filter((item) => {
      const hash = extractStorageHash(item.imageUrl);
      return hash ? !existingHashes.has(hash) : false;
    });

  const merged = [
    ...missingLocal,
    ...((data.galleryItems as GalleryItem[]) ?? []),
  ];

  // The hero renders separately — a gallery tile repeating it would show
  // the same image twice, in the grid and in the lightbox. Remaining
  // duplicates collapse by URL and content hash.
  const heroImageUrl =
    typeof data.heroImageUrl === 'string' ? data.heroImageUrl : undefined;
  const withoutHeroDuplicates = heroImageUrl
    ? merged.filter((item) => item.imageUrl !== heroImageUrl)
    : merged;

  return {
    ...data,
    galleryItems: dedupeGalleryItems(withoutHeroDuplicates),
  };
}
