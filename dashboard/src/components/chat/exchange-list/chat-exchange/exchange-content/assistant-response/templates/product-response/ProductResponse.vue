<script setup lang="ts">
import { computed } from 'vue';

import type {
  HarnessResponseData,
  ShopOffer,
} from '@/types/harness-response-data.model';

import ParagraphSection from '../../sections/paragraph-section/ParagraphSection.vue';
import SourcesSection from '../../sections/sources-section/SourcesSection.vue';
import VideoGallerySection from '../../sections/video-gallery-section/VideoGallerySection.vue';
import ProductProsCons from './product-pros-cons/ProductProsCons.vue';
import ProductReviewsSection from './product-reviews-section/ProductReviewsSection.vue';
import ProductSpotlightHero from './product-spotlight-hero/ProductSpotlightHero.vue';
import ProductStatHighlights from './product-stat-highlights/ProductStatHighlights.vue';
import ShopOffersSection from './shop-offers-section/ShopOffersSection.vue';

const props = defineProps<{ data: HarnessResponseData }>();

const offers = computed<ShopOffer[]>(() => {
  if (!props.data.shopOffers?.length) return [];
  return [...props.data.shopOffers].sort(
    (a, b) => priceNumeric(a.price) - priceNumeric(b.price),
  );
});

function priceNumeric(price?: string): number {
  if (!price) return Infinity;
  // Installment/subscription prices (e.g. "$29.12/mo") are not comparable
  // to one-time prices — sort them last instead of letting them win.
  if (price.includes('/')) return Infinity;
  const n = parseFloat(price.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : Infinity;
}

const priceRange = computed(() => {
  if (props.data.priceRange) return props.data.priceRange;
  const cheapest = offers.value[0]?.price;
  return cheapest ? `From ${cheapest}` : '';
});

const galleryItems = computed(() => {
  const items = props.data.galleryItems ?? [];
  const hero = props.data.heroImageUrl;
  if (!hero) return items;
  return items.filter((item) => item.imageUrl !== hero);
});

const hasContent = computed(
  () =>
    Boolean(props.data.title) ||
    offers.value.length > 0 ||
    (props.data.keyPoints?.length ?? 0) > 0,
);
</script>

<template>
  <section v-if="hasContent" class="product">
    <!-- Editorial hero: media at 2/5, decision column at 3/5 -->
    <ProductSpotlightHero
      :category="data.category"
      :title="data.title"
      :subtitle="data.subtitle"
      :description="data.shortDescription"
      :image-url="data.heroImageUrl"
      :image-alt="data.heroImageAlt"
      :images="galleryItems"
      :gallery-title="data.galleryTitle"
      :video-url="data.heroVideoUrl"
      :video-title="data.heroVideoTitle"
      :video-caption="data.heroVideoCaption"
      :rating="data.aggregateRating"
      :rating-count="data.aggregateRatingCount"
      :rating-label="data.aggregateRatingLabel"
      :price-range="priceRange"
      :offer-count="offers.length"
      :buy-advice="data.buyAdvice"
      :best-offer="offers[0]"
    />

    <!-- Big-number stat row with expandable full spec table -->
    <ProductStatHighlights
      :stats="data.statHighlights"
      :spec-items="data.keyPoints"
    />

    <!-- Review consensus distilled into strengths and caveats -->
    <ProductProsCons :pros="data.pros" :cons="data.cons" />

    <!-- Shop purchase links sorted by ascending price -->
    <ShopOffersSection :offers="offers" />

    <!-- Review highlights from editorial and seller reviews -->
    <ProductReviewsSection
      v-if="data.reviewSummary?.length"
      :reviews="data.reviewSummary"
    />

    <!-- Optional deep-dive paragraphs -->
    <ParagraphSection
      :title="data.sectionTitle"
      :content="data.sectionContent"
    />

    <!-- Supplementary content: videos and sources -->
    <VideoGallerySection
      :title="data.videoGalleryTitle"
      :items="data.videoGalleryItems"
    />

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

.product--empty {
  padding: var(--spacing-4);
  border: 1px solid var(--color-divider);
  background-color: var(--color-bg-tertiary);
  text-align: center;
  color: var(--color-fg-muted);
}
</style>
