import type { RelatedStory } from '@/types/harness-response-data.model';

/** Props for `RelatedStoriesSection`, the grid of related-story cards. */
export interface RelatedStoriesSectionProps {
  /** Stories to render; cards without an image are dropped. */
  items?: RelatedStory[];
  /** First story spans the full row (art direction). */
  spans?: boolean;
}
