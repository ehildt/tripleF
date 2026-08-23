import { computed } from 'vue';

import { useHarnessMediaPriority } from '../../../shared/composables/use-harness-media-priority.composable';
import type { SummaryResponseProps } from '../SummaryResponse.types';

/**
 * Derives the summary template's display values from the raw response: the
 * media ordering and whether any content exists to render.
 */
export function useSummaryResponseData(props: SummaryResponseProps) {
  const { heroUrl, videosFirst } = useHarnessMediaPriority(props.data);

  const hasAnyContent = computed(() =>
    Boolean(
      props.data.category ||
      props.data.title ||
      props.data.subtitle ||
      props.data.summary ||
      props.data.keyFindings?.length ||
      props.data.sources?.length ||
      heroUrl.value ||
      props.data.videoGalleryItems?.length ||
      props.data.galleryItems?.length,
    ),
  );

  return { videosFirst, hasAnyContent };
}
