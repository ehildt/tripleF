<script setup lang="ts">
/**
 * One compact purchase option: product image, concrete info (title, store,
 * rating, delivery, price) and below it a single direct link to the product
 * page on the shop — no extra images or links.
 */
import { computed } from 'vue';

import type { ShopOffer } from '@/types/harness-response-data.model';

import StarRatingIndicator from '../../../shared/ui/star-rating-indicator/StarRatingIndicator.vue';

const props = defineProps<{ offer: ShopOffer; isBestPrice?: boolean }>();

const ctaLabel = computed(() =>
  props.offer.source ? `View at ${props.offer.source}` : 'Visit shop',
);
</script>

<template>
  <article
    class="shoplist-card"
    :class="{ 'shoplist-card--best': isBestPrice }"
  >
    <!-- Concrete product info with a single product image -->
    <div class="shoplist-card__body">
      <div v-if="offer.imageUrl" class="shoplist-card__thumb">
        <img
          :src="offer.imageUrl"
          :alt="offer.title || 'Product image'"
          class="shoplist-card__img"
          loading="lazy"
        />
      </div>

      <div class="shoplist-card__info">
        <div class="shoplist-card__heading">
          <h3 v-if="offer.title" class="shoplist-card__title">
            {{ offer.title }}
          </h3>
          <span v-if="isBestPrice" class="shoplist-card__best">Best price</span>
          <span v-if="offer.price" class="shoplist-card__price">
            {{ offer.price }}
          </span>
        </div>

        <span class="shoplist-card__meta">
          <span v-if="offer.source" class="shoplist-card__store">
            {{ offer.source }}
          </span>
          <StarRatingIndicator
            v-if="offer.rating"
            :rating="offer.rating"
            :count="offer.ratingCount"
          />
          <span v-if="offer.delivery" class="shoplist-card__delivery">
            {{ offer.delivery }}
          </span>
        </span>
      </div>
    </div>

    <!-- One direct link: the product page on the shop -->
    <a
      v-if="offer.link"
      :href="offer.link"
      target="_blank"
      rel="noopener noreferrer"
      class="shoplist-card__cta"
    >
      {{ ctaLabel }}
      <span aria-hidden="true">→</span>
    </a>
  </article>
</template>

<style scoped>
.shoplist-card {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-divider);
  transition: border-color 0.2s ease;
}

.shoplist-card:hover {
  border-color: var(--color-accent-primary);
}

.shoplist-card--best {
  border-color: color-mix(
    in srgb,
    var(--color-status-success) 55%,
    var(--color-divider)
  );
}

/* Body: image + info */

.shoplist-card__body {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-1-5) var(--spacing-2);
}

.shoplist-card__thumb {
  flex-shrink: 0;
  width: 4.5rem;
  height: 4.5rem;
  overflow: hidden;
  background-color: var(--color-bg-tertiary);
}

.shoplist-card__img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.shoplist-card__info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-0-5);
  min-width: 0;
  flex: 1;
}

.shoplist-card__heading {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-1-5);
}

.shoplist-card__title {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.35;
  color: var(--color-fg-primary);
  overflow-wrap: anywhere;
  flex: 1;
  min-width: 0;
}

.shoplist-card__best {
  flex-shrink: 0;
  font-size: 0.65rem;
  font-weight: 700;
  font-family: var(--font-mono);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-status-success);
}

.shoplist-card__price {
  flex-shrink: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-fg-primary);
}

.shoplist-card--best .shoplist-card__price {
  color: var(--color-status-success);
}

.shoplist-card__meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-2);
}

.shoplist-card__store {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--color-fg-secondary);
}

.shoplist-card__delivery {
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: var(--color-fg-muted);
}

/* Single direct CTA link below the info */

.shoplist-card__cta {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  padding: var(--spacing-1) var(--spacing-2);
  border-top: 1px solid var(--color-divider);
  font-size: 0.85rem;
  font-weight: 600;
  text-decoration: none;
  color: var(--color-accent-primary);
  transition: background-color 0.2s ease;
}

.shoplist-card__cta:hover {
  background-color: color-mix(
    in srgb,
    var(--color-accent-primary) 6%,
    transparent
  );
}
</style>
