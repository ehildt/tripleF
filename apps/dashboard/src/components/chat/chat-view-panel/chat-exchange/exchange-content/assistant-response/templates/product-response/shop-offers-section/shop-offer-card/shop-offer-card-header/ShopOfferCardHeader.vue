<script setup lang="ts">
import StarRatingIndicator from '@/components/chat/chat-view-panel/chat-exchange/exchange-content/assistant-response/shared/ui/star-rating-indicator/StarRatingIndicator.vue';

import type { ShopOfferCardHeaderProps } from './ShopOfferCardHeader.types';

defineProps<ShopOfferCardHeaderProps>();
</script>

<template>
  <div class="shop-offer-card-header">
    <div class="shop-offer-card-header__left">
      <span v-if="shop" class="shop-offer-card-header__shop">{{ shop }}</span>
      <StarRatingIndicator
        v-if="rating"
        :rating="rating"
        :count="ratingCount"
      />
    </div>
    <span v-if="isBestPrice" class="shop-offer-card-header__best-badge">
      {{ $t('common.bestPrice') }}
    </span>
  </div>
</template>

<style scoped>
.shop-offer-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-0-5);
}

.shop-offer-card-header__left {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  min-width: 0;
}

.shop-offer-card-header__shop {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-fg-primary);
  overflow-wrap: anywhere;
}

.shop-offer-card-header__best-badge {
  flex-shrink: 0;
  font-size: 0.65rem;
  font-weight: 700;
  font-family: var(--font-mono);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-status-success);
}
</style>
