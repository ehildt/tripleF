<script setup lang="ts">
/**
 * Editorial product hero: media on the left (2/5 of the row — video first,
 * image otherwise), the decision column on the right (3/5): eyebrow label,
 * large title, rating, prominent price, lead description, buy advice and a
 * text-link CTA to the cheapest offer. Depth comes from whitespace and
 * hairlines — no boxes, no tint panels, no truncation.
 *
 * Orchestrator: the media viewer and info column are child components.
 */
import { computed, inject } from 'vue';

import type {
  GalleryItem,
  HarnessImageClickedHandler,
  ShopOffer,
} from '@/types/harness-response-data.model';
import { harnessImageClickedKey } from '@/types/harness-response-data.model';

import { isTrustedImageUrl } from '../../../composables/helpers/is-trusted-image-url.helper';
import ProductSpotlightInfo from './product-spotlight-info/ProductSpotlightInfo.vue';
import ProductSpotlightMedia from './product-spotlight-media/ProductSpotlightMedia.vue';

const props = defineProps<{
  category?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  imageAlt?: string;
  imageCaption?: string;
  videoUrl?: string;
  videoTitle?: string;
  videoCaption?: string;
  rating?: number;
  ratingCount?: number;
  ratingLabel?: string;
  priceRange?: string;
  offerCount?: number;
  buyAdvice?: string;
  bestOffer?: ShopOffer;
}>();

const onImageClicked = inject<HarnessImageClickedHandler>(
  harnessImageClickedKey,
);

/** The single hero slide: the trusted product image rendered in the media
 *  area and handed to the lightbox on click. */
const heroSlide = computed<GalleryItem | undefined>(() => {
  if (!props.imageUrl || !isTrustedImageUrl(props.imageUrl)) return undefined;
  return {
    imageUrl: props.imageUrl,
    imageAlt: props.imageAlt,
    title: props.title,
  };
});

function openLightbox(slide?: GalleryItem) {
  const target = slide ?? heroSlide.value;
  if (target) onImageClicked?.(target);
}
</script>

<template>
  <section class="spotlight">
    <!-- Media column (2/5) -->
    <div class="spotlight__viewer">
      <ProductSpotlightMedia
        :video-url="videoUrl"
        :video-title="videoTitle"
        :video-caption="videoCaption"
        :title="title"
        :selected-slide="heroSlide"
        :image-caption="imageCaption"
        @image-clicked="openLightbox"
      />
    </div>

    <!-- Decision column (3/5) -->
    <ProductSpotlightInfo
      :category="category"
      :title="title"
      :subtitle="subtitle"
      :description="description"
      :rating="rating"
      :rating-count="ratingCount"
      :rating-label="ratingLabel"
      :price-range="priceRange"
      :offer-count="offerCount"
      :buy-advice="buyAdvice"
      :best-offer="bestOffer"
    />
  </section>
</template>

<style scoped>
.spotlight {
  display: grid;
  grid-template-columns: 2fr 3fr;
  gap: var(--spacing-4);
  align-items: start;
}

.spotlight__viewer {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

@media (max-width: 40rem) {
  .spotlight {
    grid-template-columns: 1fr;
  }
}
</style>
