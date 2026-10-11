<script setup lang="ts">
import type { ShopListOfferCardHeadingProps } from './ShopListOfferCardHeading.types';

defineProps<ShopListOfferCardHeadingProps>();
</script>

<template>
  <div
    class="shop-list-offer-card-heading"
    :class="{ 'shop-list-offer-card-heading--best': isBestPrice }"
  >
    <h3 v-if="title" class="shop-list-offer-card-heading__title">
      {{ title }}
    </h3>
    <span v-if="isBestPrice" class="shop-list-offer-card-heading__best">
      {{ $t('common.bestPrice') }}
    </span>
    <span v-if="price" class="shop-list-offer-card-heading__price">
      {{ price }}
    </span>
  </div>
</template>

<style scoped>
.shop-list-offer-card-heading {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-1-5);
}

.shop-list-offer-card-heading__title {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.35;
  color: var(--color-fg-primary);
  overflow-wrap: anywhere;
  flex: 1;
  min-width: 0;
}

.shop-list-offer-card-heading__best {
  flex-shrink: 0;
  font-size: 0.65rem;
  font-weight: 700;
  font-family: var(--font-mono);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-status-success);
}

.shop-list-offer-card-heading__price {
  flex-shrink: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-fg-primary);
}

.shop-list-offer-card-heading--best .shop-list-offer-card-heading__price {
  color: var(--color-status-success);
}
</style>
