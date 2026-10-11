<script setup lang="ts">
import StarRatingIndicator from '@/components/chat/chat-view-panel/chat-exchange/exchange-content/assistant-response/shared/ui/star-rating-indicator/StarRatingIndicator.vue';

import type { ProductBannerRatingProps } from './ProductBannerRating.types';

defineProps<ProductBannerRatingProps>();
</script>

<template>
  <span class="product-banner-rating">
    <StarRatingIndicator :rating="rating" :count="ratingCount" />
    <span class="product-banner-rating__value">{{ ratingValue }}</span>
    <span v-if="countText" class="product-banner-rating__count">
      · {{ countText }}
    </span>
    <span v-if="label" class="product-banner-rating__label">{{ label }}</span>
  </span>
</template>

<style scoped>
/* Always-visible rating overlay pinned to the bottom of the banner image.
   Text sits over the image, so the non-themed white values are intentional. */
.product-banner-rating {
  position: absolute;
  inset: auto 0 0 0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-1-5);
  padding: var(--spacing-2) var(--spacing-3);
  background: linear-gradient(
    to top,
    color-mix(in srgb, black 80%, transparent),
    transparent
  );
  color: white;
  font-size: 0.85rem;
}

.product-banner-rating__value {
  font-weight: 700;
}

.product-banner-rating__count {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: color-mix(in srgb, white 80%, transparent);
}

.product-banner-rating__label {
  margin-left: auto;
  font-size: 0.7rem;
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: color-mix(in srgb, white 85%, transparent);
}
</style>
