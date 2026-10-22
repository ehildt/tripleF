import { computed } from 'vue';

import { filterValidRelatedStories } from '../helpers/filter-valid-related-stories.helper';
import type { RelatedStoriesSectionProps } from '../RelatedStoriesSection.types';

/** Derives the image-backed related-story cards from the section's props. */
export function useRelatedStoriesSection(props: RelatedStoriesSectionProps) {
  const validItems = computed(() => filterValidRelatedStories(props.items));

  return { validItems };
}
