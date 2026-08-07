<script setup lang="ts">
import { computed } from 'vue';

import type { ShopOffer } from '@/types/harness-response-data.model';

import StarRatingIndicator from '../../../../shared/ui/star-rating-indicator/StarRatingIndicator.vue';

const props = defineProps<{ offer: ShopOffer; isBestPrice?: boolean }>();

const displayPrice = computed(() => props.offer.price ?? 'Check price');
</script>

<template>
  <a
    v-if="offer.link"
    :href="offer.link"
    target="_blank"
    rel="noopener noreferrer"
    class="offer__link offer"
    :class="{ 'offer--best': isBestPrice }"
  >
    <div class="offer__body">
      <!-- Shop name as the title, with the shop rating after it -->
      <div class="offer__header">
        <div class="offer__header-left">
          <span v-if="offer.source" class="offer__shop">
            {{ offer.source }}
          </span>
          <StarRatingIndicator
            v-if="offer.rating"
            :rating="offer.rating"
            :count="offer.ratingCount"
          />
        </div>
        <span v-if="isBestPrice" class="offer__best-badge">Best price</span>
      </div>

      <!-- Offer text, delivery, and price in a single row -->
      <div class="offer__row">
        <span v-if="offer.title" class="offer__text">{{ offer.title }}</span>
        <span v-if="offer.delivery" class="offer__delivery">
          {{ offer.delivery }}
        </span>
        <span class="offer__price">{{ displayPrice }}</span>
      </div>
    </div>
  </a>
</template>

<style scoped>
.offer__link {
  display: block;
  padding: var(--spacing-1);
  text-decoration: none;
  color: inherit;
  border: 1px solid var(--color-divider);
  transition: background-color 0.2s ease;
}

/* Reset the global .exchange-message div padding that leaks into the card's
   inner divs (specificity (0,2,1) beats a bare class). */
.offer__link .offer__body,
.offer__link .offer__body div {
  padding: 0;
}

.offer__link:hover {
  background-color: color-mix(
    in srgb,
    var(--color-accent-primary) 6%,
    transparent
  );
}

.offer__body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-0-5);
}

/* Header: shop name (title) + rating, best-price marker on the right */

.offer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-0-5);
}

.offer__header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  min-width: 0;
}

.offer__shop {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-fg-primary);
  overflow-wrap: anywhere;
}

.offer__best-badge {
  flex-shrink: 0;
  font-size: 0.65rem;
  font-weight: 700;
  font-family: var(--font-mono);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-status-success);
}

/* Row: offer text + delivery + price */

.offer__row {
  display: flex;
  align-items: center;
  gap: var(--spacing-0-5);
  min-width: 0;
}

.offer__text {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 0.85rem;
  line-height: 1.35;
  color: var(--color-fg-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.offer__delivery {
  flex-shrink: 0;
  font-size: 0.7rem;
  font-family: var(--font-mono);
  color: var(--color-fg-muted);
  white-space: nowrap;
}

.offer__price {
  flex-shrink: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-fg-primary);
}

.offer--best .offer__price {
  color: var(--color-status-success);
}
</style>
