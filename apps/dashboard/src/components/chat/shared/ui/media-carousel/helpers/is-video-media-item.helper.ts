import type {
  MediaItem,
  VideoGalleryItem,
} from '@/types/harness-response-data.model';

/**
 * Narrow a media slide to a video item. Video items carry a `videoUrl`;
 * image items never do, so presence alone discriminates the union.
 */
export function isVideoMediaItem(item: MediaItem): item is VideoGalleryItem {
  return 'videoUrl' in item;
}
