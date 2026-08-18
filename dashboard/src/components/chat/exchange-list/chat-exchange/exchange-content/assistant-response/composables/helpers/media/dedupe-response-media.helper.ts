import type {
  ArticleCard,
  GalleryItem,
  HarnessResponseData,
  RelatedStory,
  VideoGalleryItem,
} from '@/types/harness-response-data.model';

import { videoUrlKeys } from './video-url-keys.helper';

/**
 * Keep the first occurrence of each key, dropping items that reuse a key
 * already spent elsewhere. Items without any key pass through unchanged —
 * they cannot collide.
 */
function dedupeUnseenByKeys<T>(
  items: T[],
  keyOf: (item: T) => Array<string | undefined>,
  seen: Set<string>,
): T[] {
  return items.filter((item) => {
    const keys = keyOf(item).filter((key): key is string => Boolean(key));
    if (keys.length === 0) return true;
    if (keys.some((key) => seen.has(key))) return false;
    keys.forEach((key) => seen.add(key));
    return true;
  });
}

/**
 * A kept thumbnail marks its image as spent; a thumbnail that reuses hero or
 * gallery imagery (or an earlier thumbnail) is blanked in place so the story
 * card itself survives.
 */
function blankReusedThumbnail(
  story: RelatedStory,
  seenImageUrls: Set<string>,
): RelatedStory {
  if (!story.imageUrl) return story;
  if (seenImageUrls.has(story.imageUrl)) return { ...story, imageUrl: '' };
  seenImageUrls.add(story.imageUrl);
  return story;
}

/**
 * Guarantee on-screen media and aside uniqueness regardless of model output:
 *
 * - Hero media never reappears in galleries. The hero image counts as spent
 *   only when there is no hero video — with a video hero the image never
 *   renders as hero, so it may stay gallery content. In a merge, every topic
 *   hero in bodySections counts the same way against the merged galleries.
 * - Galleries contain no duplicates (images by URL, videos by canonical
 *   provider key so YouTube watch/shorts/embed/youtu.be variants collapse).
 * - Aside elements (relatedStories, cards) reuse neither the URLs spent on
 *   sources nor each other's, and related-story thumbnails never reuse hero
 *   or gallery imagery.
 *
 * Arrays may end up empty — sections hide themselves on empty input.
 */
/**
 * The hero media that renders on screen: the response-level hero plus every
 * per-topic hero in a merge. An image hero counts as spent only when no
 * video hero renders instead (with a video hero the image never shows, so
 * it may stay gallery content).
 */
function collectRenderedHeroes(data: HarnessResponseData): {
  imageUrls: string[];
  videoKeys: string[];
} {
  const imageUrls: string[] = [];
  const videoKeys: string[] = [];
  const heroes: Array<{
    heroImageUrl?: string;
    heroVideoUrl?: string;
  }> = [data, ...(data.bodySections ?? [])];
  for (const hero of heroes) {
    if (hero.heroImageUrl && !hero.heroVideoUrl)
      imageUrls.push(hero.heroImageUrl);
    if (hero.heroVideoUrl) videoKeys.push(...videoUrlKeys(hero.heroVideoUrl));
  }
  return { imageUrls, videoKeys };
}

export function dedupeResponseMedia(data: HarnessResponseData): void {
  const { imageUrls, videoKeys } = collectRenderedHeroes(data);
  const seenImageUrls = new Set<string>(imageUrls);

  if (data.galleryItems) {
    data.galleryItems = dedupeUnseenByKeys(
      data.galleryItems,
      (item: GalleryItem) => [item.imageUrl],
      seenImageUrls,
    );
  }

  if (data.videoGalleryItems) {
    const seenVideoKeys = new Set<string>(videoKeys);
    data.videoGalleryItems = dedupeUnseenByKeys(
      data.videoGalleryItems,
      (item: VideoGalleryItem) => videoUrlKeys(item.videoUrl),
      seenVideoKeys,
    );
  }

  const sourceUrls = new Set(
    (data.sources ?? [])
      .map((source) => source.url)
      .filter((url): url is string => Boolean(url)),
  );

  if (data.relatedStories) {
    const seenStoryUrls = new Set<string>(sourceUrls);
    data.relatedStories = dedupeUnseenByKeys(
      data.relatedStories,
      (story: RelatedStory) => [story.url],
      seenStoryUrls,
    ).map((story) => blankReusedThumbnail(story, seenImageUrls));
  }

  if (data.cards) {
    const seenCardUrls = new Set<string>(sourceUrls);
    data.cards = dedupeUnseenByKeys(
      data.cards,
      (card: ArticleCard) => [card.url],
      seenCardUrls,
    );
  }
}
