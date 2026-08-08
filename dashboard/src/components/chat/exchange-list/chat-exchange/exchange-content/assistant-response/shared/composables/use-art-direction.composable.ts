import { computed } from 'vue';

import type { HarnessResponseData } from '@/types/harness-response-data.model';

/** The response fields the art-direction treatments read. */
export interface ArtDirectionInput {
  data: HarnessResponseData;
}

/** Body prose switches to two CSS columns above this length (split direction). */
const MULTICOL_BODY_MIN_CHARS = 600;
/** The first card/related-story tile spans the grid from this count. */
const SPAN_TILES_MIN_COUNT = 3;

/**
 * Art direction for snippet-composed responses (news, article, evaluation):
 * maps the model-chosen `layout` (first JSON key, validated server-side) to
 * the per-module treatments the sections consume. Each treatment degrades
 * to the classic stacked flow when its content is missing — the server
 * already coerces precondition violations, this is defense in depth.
 */
export function useArtDirection(props: ArtDirectionInput) {
  const direction = computed(() => props.data.layout ?? 'classic');

  /** split (ar2): hero media panel beside the headline/meta/lead stack. */
  const splitHero = computed(() => direction.value === 'split');

  /** editorial (ar1): body prose beside an enlarged pull-quote aside. */
  const quoteAside = computed(() => direction.value === 'editorial');

  /** split (ar2 lower half): body prose in two newspaper columns. */
  const multicolBody = computed(
    () =>
      direction.value === 'split' &&
      (props.data.sectionContent?.length ?? 0) >= MULTICOL_BODY_MIN_CHARS,
  );

  /** mosaic (ar4): dense span-grid image gallery instead of the carousel. */
  const mosaicGallery = computed(() => direction.value === 'mosaic');

  /** editorial/mosaic (ar5): the first card or related story spans columns. */
  const spans = computed(
    () =>
      (direction.value === 'editorial' || direction.value === 'mosaic') &&
      ((props.data.cards ?? props.data.relatedStories)?.length ?? 0) >=
        SPAN_TILES_MIN_COUNT,
  );

  return {
    direction,
    splitHero,
    quoteAside,
    multicolBody,
    mosaicGallery,
    spans,
  };
}
