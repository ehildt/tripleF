import type { VideoGalleryItem } from '@/types/assistant-response-data.model';

const STRING_FIELDS = [
  'title',
  'caption',
  'duration',
  'channel',
  'date',
  'thumbnailUrl',
  'description',
] as const satisfies readonly (keyof VideoGalleryItem)[];

/** Validate the persisted fields consumed by playlist and playback views. */
export function isVideoGalleryItem(value: unknown): value is VideoGalleryItem {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  const candidate = value as Record<keyof VideoGalleryItem, unknown>;
  if (typeof candidate.videoUrl !== 'string') return false;
  if (candidate.views !== undefined && typeof candidate.views !== 'number') {
    return false;
  }
  return STRING_FIELDS.every(
    (field) =>
      candidate[field] === undefined || typeof candidate[field] === 'string',
  );
}
