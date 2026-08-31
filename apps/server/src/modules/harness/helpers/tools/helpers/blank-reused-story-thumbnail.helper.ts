import type { MediaData } from '../enforce-available-media-urls.types.js';

/**
 * Blank one related-story thumbnail when its image URL is not from the
 * verified results or was already spent; marks a kept thumbnail's image as
 * spent so later stories cannot reuse it.
 */
export function blankReusedStoryThumbnail(
  item: unknown,
  imageUrls: Set<string>,
  usedImageUrls: Set<string>,
): { item: unknown; changed: boolean } {
  if (!item || typeof item !== 'object') return { item, changed: false };
  const story = item as MediaData;
  if (typeof story.imageUrl !== 'string' || !story.imageUrl) {
    return { item, changed: false };
  }
  if (imageUrls.has(story.imageUrl) && !usedImageUrls.has(story.imageUrl)) {
    usedImageUrls.add(story.imageUrl);
    return { item, changed: false };
  }
  return { item: { ...story, imageUrl: '' }, changed: true };
}
