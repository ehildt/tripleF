import type {
  ExtractedImageItem,
  ExtractedVideoItem,
} from './extract-media-from-tools.helper.js';
import { videoUrlKeys } from './video-url-keys.helper.js';

type MediaData = Record<string, unknown>;

/**
 * Membership enforcement for response media: the model may only use image
 * and video URLs that came back from verified tool results (or uploaded
 * images). Anything else — URLs copied out of fetched page text, or plain
 * hallucinations — is blanked so unvetted media never leaks into the
 * dashboard. Video URLs match on canonical keys so YouTube watch/embed/
 * shorts variants of an allowed video all pass.
 */
export function enforceAvailableMediaUrls(
  data: MediaData | undefined,
  allowedImages: ExtractedImageItem[],
  allowedVideos: ExtractedVideoItem[],
  extraImageUrls: string[] = [],
): MediaData | undefined {
  if (!data) return data;

  const imageUrls = new Set([
    ...allowedImages.map((item) => item.imageUrl),
    ...extraImageUrls,
  ]);
  const videoKeys = new Set(
    allowedVideos.flatMap((item) => videoUrlKeys(item.videoUrl)),
  );

  let changed = false;
  const result: MediaData = { ...data };

  if (
    typeof result.heroImageUrl === 'string' &&
    result.heroImageUrl &&
    !imageUrls.has(result.heroImageUrl)
  ) {
    result.heroImageUrl = '';
    changed = true;
  }

  if (Array.isArray(result.galleryItems)) {
    const kept = result.galleryItems.filter(
      (item) =>
        item &&
        typeof item === 'object' &&
        typeof (item as MediaData).imageUrl === 'string' &&
        imageUrls.has((item as MediaData).imageUrl as string),
    );
    if (kept.length !== result.galleryItems.length) {
      result.galleryItems = kept;
      changed = true;
    }
  }

  if (
    typeof result.heroVideoUrl === 'string' &&
    result.heroVideoUrl &&
    !videoUrlKeys(result.heroVideoUrl).some((key) => videoKeys.has(key))
  ) {
    result.heroVideoUrl = '';
    changed = true;
  }

  if (Array.isArray(result.videoGalleryItems)) {
    const kept = result.videoGalleryItems.filter(
      (item) =>
        item &&
        typeof item === 'object' &&
        typeof (item as MediaData).videoUrl === 'string' &&
        videoUrlKeys((item as MediaData).videoUrl as string).some((key) =>
          videoKeys.has(key),
        ),
    );
    if (kept.length !== result.videoGalleryItems.length) {
      result.videoGalleryItems = kept;
      changed = true;
    }
  }

  return changed ? result : data;
}
