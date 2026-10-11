import type { RelatedStory } from '@/types/harness-response-data.model';

/** Returns the most descriptive alt text, or an empty string when none. */
export function imageAltFor(story: RelatedStory): string {
  return story.title || story.sourceName || '';
}
