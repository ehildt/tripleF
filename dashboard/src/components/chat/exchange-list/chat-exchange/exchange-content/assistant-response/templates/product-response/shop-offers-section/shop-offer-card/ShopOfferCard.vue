<script setup lang="ts">
import { computed } from 'vue';

import type { ShopOffer } from '@/types/harness-response-data.model';

import StarRatingIndicator from '../../star-rating-indicator/StarRatingIndicator.vue';

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
    <!-- Store + product info -->
    <div class="offer__left">
      <span v-if="offer.source" class="offer__store-badge">
        {{ offer.source }}
      </span>
      <div class="offer__text">
        <span v-if="offer.title" class="offer__title">{{ offer.title }}</span>
        <span class="offer__meta">
          <StarRatingIndicator
            v-if="offer.rating"
            :rating="offer.rating"
            :count="offer.ratingCount"
          />
          <span v-if="offer.delivery" class="offer__delivery">
            {{ offer.delivery }}
          </span>
        </span>
      </div>
    </div>

    <!-- Price + CTA -->
    <div class="offer__right">
      <span v-if="isBestPrice" class="offer__best-badge">Best price</span>
      <span class="offer__price">{{ displayPrice }}</span>
      <span class="offer__cta">→</span>
    </div>
  </a>
</template>

<style scoped>
.offer__link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-3);
  padding: var(--spacing-2) var(--spacing-1);
  text-decoration: none;
  color: inherit;
  border-bottom: 1px solid var(--color-divider);
  transition: background-color 0.2s ease;
}

.offer__link:first-child {
  border-top: 1px solid var(--color-divider);
}

.offer__link:hover {
  background-color: color-mix(
    in srgb,
    var(--color-accent-primary) 6%,
    transparent
  );
}

/* Left side: store + info */

.offer__left {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-2);
  min-width: 0;
  flex: 1;
}

.offer__store-badge {
  flex-shrink: 0;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--color-fg-primary);
}

.offer__text {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-0-5);
  min-width: 0;
}

.offer__title {
  font-size: 0.85rem;
  line-height: 1.35;
  color: var(--color-fg-secondary);
  overflow-wrap: anywhere;
}

.offer__meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-2);
}

.offer__delivery {
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: var(--color-fg-muted);
}

/* Right side: best-price marker + price + arrow */

.offer__right {
  flex-shrink: 0;
  display: flex;
  align-items: baseline;
  gap: var(--spacing-2);
  text-align: right;
}

.offer__best-badge {
  font-size: 0.65rem;
  font-weight: 700;
  font-family: var(--font-mono);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-status-success);
}

.offer--best .offer__price {
  color: var(--color-status-success);
}

.offer__price {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-fg-primary);
}

.offer__cta {
  font-size: 1rem;
  color: var(--color-fg-muted);
  transition:
    color 0.2s ease,
    transform 0.2s ease;
}

.offer__link:hover .offer__cta {
  color: var(--color-accent-primary);
  transform: translateX(2px);
}
</style>
