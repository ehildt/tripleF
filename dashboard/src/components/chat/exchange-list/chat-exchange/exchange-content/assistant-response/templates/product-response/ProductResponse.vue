<script setup lang="ts">
import { computed } from 'vue';

import type {
  HarnessResponseData,
  ShopOffer,
  VideoGalleryItem,
} from '@/types/harness-response-data.model';

import SourcesSection from '../../sections/sources-section/SourcesSection.vue';
import VideoGallerySection from '../../sections/video-gallery-section/VideoGallerySection.vue';
import { priceNumeric } from '../../shared/helpers/price-numeric.helper';
import ProductBanner from './product-banner/ProductBanner.vue';
import ProductProsCons from './product-pros-cons/ProductProsCons.vue';
import ProductStatHighlights from './product-stat-highlights/ProductStatHighlights.vue';
import ShopOffersSection from './shop-offers-section/ShopOffersSection.vue';

const props = defineProps<{ data: HarnessResponseData }>();

const offers = computed<ShopOffer[]>(() => {
  if (!props.data.shopOffers?.length) return [];
  return [...props.data.shopOffers].sort(
    (a, b) => priceNumeric(a.price) - priceNumeric(b.price),
  );
});

/** Product-review videos, capped at 3. */
const videos = computed<VideoGalleryItem[]>(() =>
  (props.data.videoGalleryItems ?? []).slice(0, 3),
);

const hasContent = computed(
  () =>
    Boolean(props.data.title) ||
    offers.value.length > 0 ||
    (props.data.keyPoints?.length ?? 0) > 0,
);
</script>

<template>
  <section v-if="hasContent" class="product">
    <!-- Full-width product banner with an always-visible rating overlay -->
    <ProductBanner
      :category="data.category"
      :title="data.title"
      :subtitle="data.subtitle"
      :image-url="data.heroImageUrl"
      :image-alt="data.heroImageAlt"
      :image-caption="data.heroCaption"
      :rating="data.aggregateRating"
      :rating-count="data.aggregateRatingCount"
      :rating-label="data.aggregateRatingLabel"
    />

    <!-- Brief product description -->
    <p v-if="data.shortDescription" class="product__lead">
      {{ data.shortDescription }}
    </p>

    <!-- Big-number stat row with expandable full spec table -->
    <ProductStatHighlights
      :stats="data.statHighlights"
      :spec-items="data.keyPoints"
    />

    <!-- Review consensus distilled into strengths and caveats -->
    <ProductProsCons :pros="data.pros" :cons="data.cons" />

    <!-- Product-review videos (max 3, in a row) -->
    <VideoGallerySection
      :title="data.videoGalleryTitle"
      :items="videos"
      :columns="3"
    />

    <!-- Shop purchase links sorted by ascending price -->
    <ShopOffersSection :offers="offers" />

    <!-- Attribution -->
    <SourcesSection :items="data.sources" />
  </section>

  <!-- Empty state -->
  <section v-else class="product product--empty">
    <p>No product information found for this request.</p>
  </section>
</template>

<style scoped>
.product {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.product__lead {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--color-fg-secondary);
}

.product--empty {
  padding: var(--spacing-4);
  border: 1px solid var(--color-divider);
  background-color: var(--color-bg-tertiary);
  text-align: center;
  color: var(--color-fg-muted);
}
</style>
