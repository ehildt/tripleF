<script setup lang="ts">
import EmptyStateSection from '../../sections/empty-state-section/EmptyStateSection.vue';
import SourcesSection from '../../sections/sources-section/SourcesSection.vue';
import VideoGallerySection from '../../sections/video-gallery-section/VideoGallerySection.vue';
import { useProductResponseData } from './composables/use-product-response-data.composable';
import ProductBanner from './product-banner/ProductBanner.vue';
import ProductProsCons from './product-pros-cons/ProductProsCons.vue';
import ProductStatHighlights from './product-stat-highlights/ProductStatHighlights.vue';
import ShopOffersSection from './shop-offers-section/ShopOffersSection.vue';
import type { ProductResponseProps } from './ProductResponse.types';

const props = defineProps<ProductResponseProps>();

const { offers, videos, imageCount, hasContent } =
  useProductResponseData(props);
</script>

<template>
  <section v-if="hasContent" class="product">
    <!-- Full-width product banner with an always-visible rating overlay -->
    <ProductBanner
      :title="data.title"
      :subtitle="data.subtitle"
      :image-url="data.heroImageUrl"
      :image-alt="data.heroImageAlt"
      :image-caption="data.heroCaption"
      :image-count="imageCount"
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
  <EmptyStateSection v-else :message="$t('common.noProductFound')" />
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
</style>
