<script setup lang="ts">
import type { StockmarketItemDescriptionProps } from './StockmarketItemDescription.types';

/**
 * Short description paragraph of a single-instrument stock card.
 * Presentational.
 */
defineProps<StockmarketItemDescriptionProps>();
</script>

<template>
  <p class="stockmarket-item-description">{{ text }}</p>
</template>

<style scoped>
.stockmarket-item-description {
  margin: 0;
  color: var(--color-fg-primary);
}
</style>
