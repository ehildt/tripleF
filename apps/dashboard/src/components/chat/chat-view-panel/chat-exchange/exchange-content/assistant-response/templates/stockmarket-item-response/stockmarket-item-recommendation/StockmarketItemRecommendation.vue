<script setup lang="ts">
import type { StockmarketItemRecommendationProps } from './StockmarketItemRecommendation.types';

/**
 * Recommendation callout of a single-instrument stock card: the verdict
 * (e.g. Buy/Hold/Sell) with optional reasoning. Presentational.
 */
defineProps<StockmarketItemRecommendationProps>();
</script>

<template>
  <div class="stockmarket-item-recommendation">
    <strong>{{ recommendation }}</strong>
    <span v-if="reasoning">— {{ reasoning }}</span>
  </div>
</template>

<style scoped>
.stockmarket-item-recommendation {
  padding: var(--spacing-2) var(--spacing-3);
  border-left: 0.2rem solid var(--color-accent-primary);
  background-color: var(--color-bg-tertiary);
  color: var(--color-fg-primary);
}
</style>
