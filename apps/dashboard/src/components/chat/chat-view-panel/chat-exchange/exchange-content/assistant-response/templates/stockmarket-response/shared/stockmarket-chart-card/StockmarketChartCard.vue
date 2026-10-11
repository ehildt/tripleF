<script setup lang="ts">
import { computed } from 'vue';

import type { StockmarketChartCardProps } from './StockmarketChartCard.types';

const props = defineProps<StockmarketChartCardProps>();
const activeTab = defineModel<string>({ required: true });
const selectedTicker = defineModel<string | undefined>('selectedTicker');

const hasTickerSelector = computed(
  () => (props.tickers?.length ?? 0) > 1 && props.showTickerSelector !== false,
);
</script>

<template>
  <div class="stockmarket-chart-card">
    <div class="stockmarket-chart-card__tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        class="stockmarket-chart-card__tab"
        :class="{
          'stockmarket-chart-card__tab--active': activeTab === tab.id,
        }"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <div
      v-if="hasTickerSelector"
      class="stockmarket-chart-card__ticker-selector"
    >
      <button
        v-for="t in tickers"
        :key="t"
        type="button"
        class="stockmarket-chart-card__ticker"
        :class="{
          'stockmarket-chart-card__ticker--active': selectedTicker === t,
        }"
        @click="selectedTicker = t"
      >
        {{ t }}
      </button>
    </div>

    <div class="stockmarket-chart-card__chart">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.stockmarket-chart-card {
  border: 1px solid var(--color-divider);
  background-color: var(--color-bg-secondary);
}

.stockmarket-chart-card__tabs {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
}

.stockmarket-chart-card__tab {
  padding: 0.3rem 0.8rem;
  font-size: 0.8rem;
  color: var(--color-fg-muted);
  background-color: transparent;
  border: none;
  cursor: pointer;
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}

.stockmarket-chart-card__tab:hover {
  color: var(--color-fg-primary);
}

.stockmarket-chart-card__tab--active {
  color: var(--color-fg-primary);
  background-color: var(--color-bg-tertiary);
}

.stockmarket-chart-card__ticker-selector {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-1);
  padding: 0 var(--spacing-2) var(--spacing-2);
}

.stockmarket-chart-card__ticker {
  padding: 0.2rem 0.6rem;
  font-size: 0.75rem;
  color: var(--color-fg-muted);
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-divider);
  cursor: pointer;
}

.stockmarket-chart-card__ticker--active {
  color: var(--color-accent-primary);
  border-color: var(--color-accent-primary);
}

.stockmarket-chart-card__chart {
  min-width: 0;
  border-top: 1px solid var(--color-divider);
  padding: var(--spacing-2);
}
</style>
