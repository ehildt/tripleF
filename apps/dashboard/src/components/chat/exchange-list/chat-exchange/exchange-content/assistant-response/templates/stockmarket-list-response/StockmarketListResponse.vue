<script setup lang="ts">
import { useAppStore } from '@/stores/app';

import SourcesSection from '../../sections/sources-section/SourcesSection.vue';
import VideoGallerySection from '../../sections/video-gallery-section/VideoGallerySection.vue';
import ResponseHeader from '../../shared/ui/response-header/ResponseHeader.vue';
import D3StackedAreaChart from '../stockmarket-response/d3-charts/D3StackedAreaChart.vue';
import D3UnifiedStockChart from '../stockmarket-response/d3-charts/D3UnifiedStockChart.vue';
import { buildChangeLabel } from '../stockmarket-response/helpers/build-change-label.helper';
import { resolveChangeClass } from '../stockmarket-response/helpers/resolve-change-class.helper';
import StockmarketChartCard from '../stockmarket-response/shared/stockmarket-chart-card/StockmarketChartCard.vue';
import { useStockmarketListData } from './composables/use-stockmarket-list-data.composable';
import type { StockmarketListResponseProps } from './StockmarketListResponse.types';

const appStore = useAppStore();
const props = defineProps<StockmarketListResponseProps>();

const {
  chartSeries,
  showChart,
  activeChart,
  tickers,
  selectedTicker,
  history,
  coverageForChart,
  onRangeRequest,
  volumeProfile,
  referenceLines,
  markers,
  chartTabs,
} = useStockmarketListData(props);
</script>

<template>
  <div class="stockmarket-list-response">
    <ResponseHeader :title="data?.title" :subtitle="data?.subtitle" />

    <p v-if="data?.summary" class="stockmarket-list-response__summary">
      {{ data.summary }}
    </p>

    <StockmarketChartCard
      v-if="showChart"
      v-model="activeChart"
      v-model:selected-ticker="selectedTicker"
      :tabs="chartTabs"
      :tickers="tickers"
      :show-ticker-selector="activeChart !== 'stacked'"
    >
      <D3UnifiedStockChart
        v-if="activeChart === 'overview'"
        :history="history"
        :reference-lines="referenceLines"
        :markers="markers"
        :volume-profile="volumeProfile"
        :available-range="coverageForChart"
        :colormap="appStore.chartConfig.colormap"
        :default-config="appStore.chartConfig"
        :on-range-request="onRangeRequest"
      />
      <D3StackedAreaChart v-else :series="chartSeries" mode="normalized" />
    </StockmarketChartCard>

    <ul v-if="data?.items?.length" class="stockmarket-list-response__items">
      <li
        v-for="(item, i) in data.items"
        :key="i"
        class="stockmarket-list-response__item"
      >
        <div class="stockmarket-list-response__item-name">
          <span class="stockmarket-list-response__item-title">
            {{ item.name }}
          </span>
          <span
            v-if="item.ticker"
            class="stockmarket-list-response__item-ticker"
          >
            {{ item.ticker }}
          </span>
        </div>
        <div class="stockmarket-list-response__item-quote">
          <span
            v-if="item.price !== undefined"
            class="stockmarket-list-response__item-price"
          >
            {{ item.price }}
          </span>
          <span
            v-if="buildChangeLabel(item.change, item.changeP)"
            class="stockmarket-list-response__item-change"
            :class="`stockmarket-list-response__item-change--${resolveChangeClass(item.changeP)}`"
          >
            {{ buildChangeLabel(item.change, item.changeP) }}
          </span>
        </div>
      </li>
    </ul>

    <VideoGallerySection
      :title="data?.videoGalleryTitle"
      :items="data?.videoGalleryItems"
    />

    <SourcesSection :items="data?.sources" />
  </div>
</template>

<style scoped>
.stockmarket-list-response {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  padding: var(--spacing-4);
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-divider);
}

.stockmarket-list-response__summary {
  margin: 0;
  padding-inline: 0.5rem;
  color: var(--color-fg-primary);
}

.stockmarket-list-response__items {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.stockmarket-list-response__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-1);
  padding: var(--spacing-1) var(--spacing-2);
  background-color: var(--color-bg-tertiary);
}

.stockmarket-list-response__item-name {
  display: flex;
  flex-direction: column;
}

.stockmarket-list-response__item-title {
  color: var(--color-fg-primary);
}

.stockmarket-list-response__item-ticker {
  color: var(--color-fg-muted);
  font-size: 0.8rem;
}

.stockmarket-list-response__item-quote {
  text-align: right;
}

.stockmarket-list-response__item-price {
  display: block;
  font-weight: 600;
  color: var(--color-fg-primary);
}

.stockmarket-list-response__item-change--positive {
  color: var(--color-status-success);
}

.stockmarket-list-response__item-change--negative {
  color: var(--color-status-error);
}

.stockmarket-list-response__item-change--neutral {
  color: var(--color-fg-muted);
}
</style>
