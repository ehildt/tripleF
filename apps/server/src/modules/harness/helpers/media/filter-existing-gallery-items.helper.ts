import type { GalleryItem } from './build-gallery-items.helper.js';

function extractStorageHash(imageUrl: string): string | undefined {
  if (!imageUrl.startsWith('/api/v1/storage/')) return undefined;
  const hash = imageUrl.split('/').pop()?.split('?')[0];
  return hash || undefined;
}

/**
 * Drop gallery items whose storage object no longer exists (e.g. evicted by
 * a lifecycle rule or removed by request cleanup), so the dashboard never
 * renders dead storage URLs. Items without a resolvable storage hash are
 * kept untouched.
 */
export async function filterExistingGalleryItems(
  items: GalleryItem[],
  objectExists: (hash: string) => Promise<boolean>,
  concurrency = 5,
): Promise<GalleryItem[]> {
  if (items.length === 0) return items;

  const results = new Array<GalleryItem | undefined>(items.length);
  let index = 0;

  const runNext = async (): Promise<void> => {
    const currentIndex = index++;
    if (currentIndex >= items.length) return;

    const item = items[currentIndex];
    const hash = extractStorageHash(item.imageUrl);
    results[currentIndex] =
      !hash || (await objectExists(hash)) ? item : undefined;

    await runNext();
  };

  const workers: Promise<void>[] = [];
  for (let i = 0; i < Math.min(concurrency, items.length); i++) {
    workers.push(runNext());
  }
  await Promise.all(workers);

  return results.filter((item): item is GalleryItem => item !== undefined);
}
