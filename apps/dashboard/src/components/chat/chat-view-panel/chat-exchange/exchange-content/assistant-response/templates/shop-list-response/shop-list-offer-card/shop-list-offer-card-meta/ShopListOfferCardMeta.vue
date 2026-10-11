<script setup lang="ts">
import StarRatingIndicator from '@/components/chat/chat-view-panel/chat-exchange/exchange-content/assistant-response/shared/ui/star-rating-indicator/StarRatingIndicator.vue';

import type { ShopListOfferCardMetaProps } from './ShopListOfferCardMeta.types';

defineProps<ShopListOfferCardMetaProps>();
</script>

<template>
  <span class="shop-list-offer-card-meta">
    <span v-if="store" class="shop-list-offer-card-meta__store">
      {{ store }}
    </span>
    <StarRatingIndicator v-if="rating" :rating="rating" :count="ratingCount" />
    <span v-if="delivery" class="shop-list-offer-card-meta__delivery">
      {{ delivery }}
    </span>
  </span>
</template>

<style scoped>
.shop-list-offer-card-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-2);
}

.shop-list-offer-card-meta__store {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--color-fg-secondary);
}

.shop-list-offer-card-meta__delivery {
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: var(--color-fg-muted);
}
</style>
