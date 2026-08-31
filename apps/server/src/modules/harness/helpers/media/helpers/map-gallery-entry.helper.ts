import type { FastifyMultipartMeta } from '../../../dtos/harness-job.dto.js';
import type { GalleryItem } from '../build-gallery-items.helper.js';

/** Build one gallery item from an original attachment meta entry. */
export function mapGalleryEntry(
  entry: FastifyMultipartMeta | undefined,
  sessionId: string | undefined,
  conversationId: string | undefined,
): GalleryItem {
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
}
