<script setup lang="ts">
import { useShopOfferCard } from './composables/use-shop-offer-card.composable';
import ShopOfferCardDetails from './shop-offer-card-details/ShopOfferCardDetails.vue';
import ShopOfferCardHeader from './shop-offer-card-header/ShopOfferCardHeader.vue';
import type { ShopOfferCardProps } from './ShopOfferCard.types';

const props = defineProps<ShopOfferCardProps>();

const { displayPrice } = useShopOfferCard(props);
</script>

<template>
  <a
    v-if="offer.link"
    :href="offer.link"
    target="_blank"
    rel="noopener noreferrer"
    class="shop-offer-card"
    :class="{ 'shop-offer-card--best': isBestPrice }"
  >
    <div class="shop-offer-card__body">
      <ShopOfferCardHeader
        :shop="offer.source"
        :rating="offer.rating"
        :rating-count="offer.ratingCount"
        :is-best-price="isBestPrice"
      />
      <ShopOfferCardDetails
        :title="offer.title"
        :delivery="offer.delivery"
        :price="displayPrice"
        :is-best-price="isBestPrice"
      />
    </div>
  </a>
</template>

<style scoped>
.shop-offer-card {
  display: block;
  padding: var(--spacing-1) var(--spacing-4);
  text-decoration: none;
  color: inherit;
  border: 1px solid var(--color-divider);
  transition: background-color 0.2s ease;
}

/* Reset the global .exchange-message div padding that leaks into the card's
   inner divs (specificity (0,2,1) beats a bare class). */
.shop-offer-card .shop-offer-card__body,
.shop-offer-card .shop-offer-card__body div {
  padding: 0;
}

.shop-offer-card:hover {
  background-color: color-mix(
    in srgb,
    var(--color-accent-primary) 6%,
    transparent
  );
}

.shop-offer-card__body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-0-5);
}
</style>
