import { computed } from 'vue';

import { useHarnessMediaPriority } from '../../../shared/composables/use-harness-media-priority.composable';
import type { NewsResponseProps } from '../NewsResponse.types';

/**
 * Derives the news template's display values from the raw response: the
 * media ordering and whether any content exists to render.
 */
export function useNewsResponseData(props: NewsResponseProps) {
  const { heroUrl, videosFirst } = useHarnessMediaPriority(props.data);

  const hasAnyContent = computed(() =>
    Boolean(
      props.data.headline ||
      props.data.deck ||
      props.data.lead ||
      props.data.sectionContent ||
      heroUrl.value ||
      props.data.keyFindings?.length ||
      props.data.sources?.length ||
      props.data.relatedStories?.length ||
      props.data.videoGalleryItems?.length ||
      props.data.galleryItems?.length,
    ),
  );

  return { videosFirst, hasAnyContent };
}
