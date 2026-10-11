<script setup lang="ts">
/**
 * One compact purchase option: product image, concrete info (title, store,
 * rating, delivery, price) and below it a single direct link to the product
 * page on the shop — no extra images or links.
 */
import AsyncImage from '@/components/shared/ui/async-image/AsyncImage.vue';

import { useShopListOfferCard } from './composables/use-shop-list-offer-card.composable';
import ShopListOfferCardHeading from './shop-list-offer-card-heading/ShopListOfferCardHeading.vue';
import ShopListOfferCardMeta from './shop-list-offer-card-meta/ShopListOfferCardMeta.vue';
import type { ShopListOfferCardProps } from './ShopListOfferCard.types';

const props = defineProps<ShopListOfferCardProps>();

const { ctaLabel } = useShopListOfferCard(props);
</script>

<template>
  <article
    class="shop-list-offer-card"
    :class="{ 'shop-list-offer-card--best': isBestPrice }"
  >
    <!-- Concrete product info with a single product image -->
    <div class="shop-list-offer-card__body">
      <div v-if="offer.imageUrl" class="shop-list-offer-card__thumb">
        <!-- The thumb is only 4.5rem — no room for a fallback message; the
             shared image settles on a quiet empty thumb on failure. -->
        <AsyncImage
          :src="offer.imageUrl"
          :alt="offer.title || $t('common.productImage')"
          fit="contain"
          :show-error-label="false"
        />
      </div>

      <div class="shop-list-offer-card__info">
        <ShopListOfferCardHeading
          :title="offer.title"
          :price="offer.price"
          :is-best-price="isBestPrice"
        />
        <ShopListOfferCardMeta
          :store="offer.source"
          :rating="offer.rating"
          :rating-count="offer.ratingCount"
          :delivery="offer.delivery"
        />
      </div>
    </div>

    <!-- One direct link: the product page on the shop -->
    <a
      v-if="offer.link"
      :href="offer.link"
      target="_blank"
      rel="noopener noreferrer"
      class="shop-list-offer-card__cta"
    >
      {{ ctaLabel }}
      <span aria-hidden="true">→</span>
    </a>
  </article>
</template>

<style scoped>
.shop-list-offer-card {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-divider);
  transition: border-color 0.2s ease;
}

.shop-list-offer-card:hover {
  border-color: var(--color-accent-primary);
}

.shop-list-offer-card--best {
  border-color: color-mix(
    in srgb,
    var(--color-status-success) 55%,
    var(--color-divider)
  );
}

/* Body: image + info */

.shop-list-offer-card__body {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-1-5) var(--spacing-2);
}

.shop-list-offer-card__thumb {
  flex-shrink: 0;
  position: relative;
  width: 4.5rem;
  height: 4.5rem;
  overflow: hidden;
  background-color: var(--color-bg-tertiary);
}

.shop-list-offer-card__info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-0-5);
  min-width: 0;
  flex: 1;
}

/* Single direct CTA link below the info */

.shop-list-offer-card__cta {
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

.shop-list-offer-card__cta:hover {
  background-color: color-mix(
    in srgb,
    var(--color-accent-primary) 6%,
    transparent
  );
}
</style>
