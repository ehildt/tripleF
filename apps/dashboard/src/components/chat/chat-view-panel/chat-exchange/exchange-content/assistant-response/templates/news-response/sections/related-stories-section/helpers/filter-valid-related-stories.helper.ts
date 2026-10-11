import type { RelatedStory } from '@/types/harness-response-data.model';

/**
 * Keeps image-backed related stories that also carry a link or title, so the
 * card never renders as an empty image placeholder.
 */
export function filterValidRelatedStories(
  items?: RelatedStory[],
): RelatedStory[] {
  return (items ?? []).filter(
    (item): item is RelatedStory =>
      typeof item === 'object' &&
      item !== null &&
      typeof item.imageUrl === 'string' &&
      item.imageUrl.length > 0 &&
      (typeof (item as RelatedStory).url === 'string' ||
        typeof (item as RelatedStory).title === 'string'),
  );
}
