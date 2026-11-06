import type {
  ExtractedImageItem,
  ExtractedVideoItem,
} from '../../helpers/media/extract-media-from-tools.types.js';

export interface SanitizeBrokenUrls {
  /** Broken image and video-thumbnail URLs removed from media candidates. */
  mediaUrls: Set<string>;
  /** Definitively dead article/page URLs removed from citations. */
  pageUrls: Set<string>;
}

export interface SanitizeVerifiedMedia {
  /** Image candidates verified as real, reachable images. */
  images: ExtractedImageItem[];
  /** Video candidates verified as real, reachable videos. */
  videos: ExtractedVideoItem[];
}
