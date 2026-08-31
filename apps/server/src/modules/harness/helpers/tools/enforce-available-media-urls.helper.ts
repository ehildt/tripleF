import type {
  ExtractedImageItem,
  ExtractedVideoItem,
} from '../media/extract-media-from-tools.types.js';
import { videoUrlKeys } from '../url-trust/video-url-keys.helper.js';

import { blankReusedStoryThumbnail } from './helpers/blank-reused-story-thumbnail.helper.js';
import type { MediaData } from './enforce-available-media-urls.types.js';

/** Gallery entries that are allowed and not yet spent (hero or earlier entry). */
function filterAllowedUnusedImages(
  items: unknown[],
  imageUrls: Set<string>,
  usedImageUrls: Set<string>,
): MediaData[] {
  return (items as MediaData[]).filter((item) => {
    const url = typeof item?.imageUrl === 'string' ? item.imageUrl : '';
    if (!url || !imageUrls.has(url) || usedImageUrls.has(url)) return false;
    usedImageUrls.add(url);
    return true;
  });
}

/**
 * The hero image only counts as spent when there is no hero video: with a
 * video hero the image never renders as hero and stays gallery content,
 * matching the client's documented hero fallthrough.
 */
function spentImageUrls(data: MediaData): Set<string> {
  const used = new Set<string>();
  if (
    !data.heroVideoUrl &&
    typeof data.heroImageUrl === 'string' &&
    data.heroImageUrl
  )
    used.add(data.heroImageUrl);
  return used;
}

/**
 * Related-story thumbnails are optional decorations: an image URL the model
 * did not take from the verified results is blanked in place so an unvetted
 * (possibly client-blocked) origin never reaches the dashboard, a thumbnail
 * that reuses hero or gallery imagery is blanked as well, and a kept
 * thumbnail marks its image as spent so later stories cannot reuse it.
 */
function blankReusedStoryThumbnails(
  items: unknown[],
  imageUrls: Set<string>,
  usedImageUrls: Set<string>,
): { stories: unknown[]; changed: boolean } {
  let changed = false;
  const stories = items.map((item) => {
    const result = blankReusedStoryThumbnail(item, imageUrls, usedImageUrls);
    if (result.changed) changed = true;
    return result.item;
  });
  return { stories, changed };
}

/** Video entries that are allowed and not spent on the hero or an earlier entry. */
function filterAllowedUnusedVideos(
  items: unknown[],
  videoKeys: Set<string>,
  usedVideoKeys: Set<string>,
): MediaData[] {
  return (items as MediaData[]).filter((item) => {
    const url = typeof item?.videoUrl === 'string' ? item.videoUrl : '';
    if (!url) return false;
    const keys = videoUrlKeys(url);
    if (
      !keys.some((key) => videoKeys.has(key)) ||
      keys.some((key) => usedVideoKeys.has(key))
    )
      return false;
    keys.forEach((key) => usedVideoKeys.add(key));
    return true;
  });
}

/**
 * Blank hero URLs that are not part of the verified tool results, so an
 * unvetted (possibly client-blocked) origin never reaches the dashboard.
 */
function blankDisallowedHeroUrls(
  data: MediaData,
  imageUrls: Set<string>,
  videoKeys: Set<string>,
): boolean {
  let changed = false;

  if (
    typeof data.heroVideoUrl === 'string' &&
    data.heroVideoUrl &&
    !videoUrlKeys(data.heroVideoUrl).some((key) => videoKeys.has(key))
  ) {
    data.heroVideoUrl = '';
    changed = true;
  }

  if (
    typeof data.heroImageUrl === 'string' &&
    data.heroImageUrl &&
    !imageUrls.has(data.heroImageUrl)
  ) {
    data.heroImageUrl = '';
    changed = true;
  }

  return changed;
}

/**
 * Membership and uniqueness enforcement for response media: the model may
 * only use image and video URLs that came back from verified tool results
 * (or uploaded images). Anything else — URLs copied out of fetched page
 * text, or plain hallucinations — is blanked so unvetted media never leaks
 * into the dashboard. Video URLs match on canonical keys so YouTube watch/
 * embed/shorts variants of an allowed video all pass.
 *
 * Uniqueness: a URL the model already spent on a hero must not reappear in
 * a gallery, gallery entries must not repeat each other, and related-story
 * thumbnails must not reuse hero or gallery imagery.
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

  if (blankDisallowedHeroUrls(result, imageUrls, videoKeys)) changed = true;

  const usedImageUrls = spentImageUrls(result);

  if (Array.isArray(result.galleryItems)) {
    const kept = filterAllowedUnusedImages(
      result.galleryItems,
      imageUrls,
      usedImageUrls,
    );
    if (kept.length !== result.galleryItems.length) {
      result.galleryItems = kept;
      changed = true;
    }
  }

  if (Array.isArray(result.relatedStories)) {
    const stories = blankReusedStoryThumbnails(
      result.relatedStories,
      imageUrls,
      usedImageUrls,
    );
    if (stories.changed) {
      result.relatedStories = stories.stories;
      changed = true;
    }
  }

  if (Array.isArray(result.videoGalleryItems)) {
    const usedVideoKeys = new Set<string>(
      typeof result.heroVideoUrl === 'string' && result.heroVideoUrl
        ? videoUrlKeys(result.heroVideoUrl)
        : [],
    );
    const kept = filterAllowedUnusedVideos(
      result.videoGalleryItems,
      videoKeys,
      usedVideoKeys,
    );
    if (kept.length !== result.videoGalleryItems.length) {
      result.videoGalleryItems = kept;
      changed = true;
    }
  }

  return changed ? result : data;
}
