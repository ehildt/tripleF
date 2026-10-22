import type { RelatedStory } from '@/types/assistant-response-data.model';

/** Props for `RelatedStoryCard`, a single image-backed related-story card. */
export interface RelatedStoryCardProps {
  /** The story to render: image, title, source, date, and link. */
  item: RelatedStory;
}
