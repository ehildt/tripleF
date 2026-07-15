import { computed, type Ref, ref } from 'vue';

import type { GalleryItem } from '@/types/harness-response-data.model';

import { isTrustedImageUrl } from '../../../../composables/helpers/is-trusted-image-url.helper';

const MAX_SLIDES = 5;

/**
 * Combine the hero image and the additional gallery items into one capped,
 * trust-filtered slide list and track which slide is currently shown in the
 * product spotlight hero's main image area.
 */
export function useHeroImageViewer(params: {
  imageUrl: Ref<string | undefined>;
  imageAlt: Ref<string | undefined>;
  title: Ref<string | undefined>;
  images: Ref<GalleryItem[] | undefined>;
}) {
  const slides = computed<GalleryItem[]>(() => {
    const all: GalleryItem[] = [];

    if (params.imageUrl.value) {
      all.push({
        imageUrl: params.imageUrl.value,
        imageAlt: params.imageAlt.value,
        title: params.title.value,
      });
    }

    all.push(...(params.images.value ?? []));

    return all
      .filter((item) => item.imageUrl && isTrustedImageUrl(item.imageUrl))
      .slice(0, MAX_SLIDES);
  });

  const selectedIndex = ref(0);

  const selectedSlide = computed<GalleryItem | undefined>(
    () => slides.value[selectedIndex.value] ?? slides.value[0],
  );

  function selectSlide(index: number) {
    selectedIndex.value = index;
  }

  return { slides, selectedIndex, selectedSlide, selectSlide };
}
