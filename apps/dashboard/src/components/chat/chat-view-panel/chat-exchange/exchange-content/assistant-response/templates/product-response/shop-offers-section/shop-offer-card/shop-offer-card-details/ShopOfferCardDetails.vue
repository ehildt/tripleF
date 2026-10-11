<script setup lang="ts">
import type { ShopOfferCardDetailsProps } from './ShopOfferCardDetails.types';

defineProps<ShopOfferCardDetailsProps>();
</script>

<template>
  <div
    class="shop-offer-card-details"
    :class="{ 'shop-offer-card-details--best': isBestPrice }"
  >
    <span v-if="title" class="shop-offer-card-details__text">{{ title }}</span>
    <span v-if="delivery" class="shop-offer-card-details__delivery">
      {{ delivery }}
    </span>
    <span class="shop-offer-card-details__price">{{ price }}</span>
  </div>
</template>

<style scoped>
.shop-offer-card-details {
  display: flex;
  align-items: center;
  gap: var(--spacing-0-5);
  min-width: 0;
}

.shop-offer-card-details__text {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 0.85rem;
  line-height: 1.35;
  color: var(--color-fg-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.shop-offer-card-details__delivery {
  flex-shrink: 0;
  font-size: 0.7rem;
  font-family: var(--font-mono);
  color: var(--color-fg-muted);
  white-space: nowrap;
}

.shop-offer-card-details__price {
  flex-shrink: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-fg-primary);
}

.shop-offer-card-details--best .shop-offer-card-details__price {
  color: var(--color-status-success);
}
</style>
