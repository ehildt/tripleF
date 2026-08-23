import type { HarnessJobPayload } from '../../dtos/harness-job.dto.js';

export interface GalleryItem extends Record<string, string> {
  imageUrl: string;
  imageAlt: string;
  title: string;
  caption: string;
  source?: 'local' | 'cloud';
}

export function buildGalleryItems(
  sessionId: string | undefined,
  conversationId: string | undefined,
  meta: HarnessJobPayload['meta'],
): GalleryItem[] {
  const seenHashes = new Set<string>();

  return meta
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => !entry?.variant || entry.variant === 'original')
    .map(({ entry }) => {
      const name = entry?.name ?? 'image';
      const hash = entry?.hash ?? '';
      const imageUrl =
        sessionId && conversationId
          ? `/api/v1/storage/${sessionId}/${conversationId}/${hash}`
          : '';

      return {
        imageUrl,
        imageAlt: name,
        title: name,
        caption: name,
        source: entry?.source ?? 'local',
      };
    })
    .filter((item) => {
      const hash = item.imageUrl.split('/').pop() ?? '';
      if (seenHashes.has(hash)) return false;
      seenHashes.add(hash);
      return true;
    });
}

/**
 * Keep only a maximum number of local/user images while preserving all cloud
 * reference images. This prevents the gallery from being dominated by many
 * uploaded images when the model should focus on a few representatives.
 */
export function limitLocalGalleryItems(
  items: GalleryItem[],
  maxLocal: number,
): GalleryItem[] {
  const localItems = items.filter((item) => item.source === 'local');
  if (localItems.length <= maxLocal) return items;

  const cloudItems = items.filter((item) => item.source === 'cloud');
  return [...localItems.slice(0, maxLocal), ...cloudItems];
}
