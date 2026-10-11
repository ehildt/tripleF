import type { RelatedStory } from '@/types/harness-response-data.model';

/** Builds the "Source · Date" meta line for a related-story card. */
export function metaFor(story: RelatedStory): string {
  const parts: string[] = [];
  if (story.sourceName) parts.push(story.sourceName);
  if (story.date) parts.push(story.date);
  return parts.join(' · ');
}
