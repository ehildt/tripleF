<script setup lang="ts">
import { useAppStore } from '@/stores/app';

import SourcesSection from '../../sections/sources-section/SourcesSection.vue';
import VideoGallerySection from '../../sections/video-gallery-section/VideoGallerySection.vue';
import ChartRow from '../../shared/ui/chart-row/ChartRow.vue';
import D3UnifiedStockChart from '../stockmarket-response/d3-charts/D3UnifiedStockChart.vue';
import { useStockmarketItemData } from './composables/use-stockmarket-item-data.composable';
import StockmarketItemDescription from './stockmarket-item-description/StockmarketItemDescription.vue';
import StockmarketItemHeader from './stockmarket-item-header/StockmarketItemHeader.vue';
import StockmarketItemPanels from './stockmarket-item-panels/StockmarketItemPanels.vue';
import StockmarketItemRecommendation from './stockmarket-item-recommendation/StockmarketItemRecommendation.vue';
import type { StockmarketItemResponseProps } from './StockmarketItemResponse.types';

const appStore = useAppStore();

const props = defineProps<StockmarketItemResponseProps>();

const {
  displayHistory,
  intradayActive,
  intradayAvailable,
  volumeProfile,
  referenceLines,
  markers,
  coverageForChart,
  fundamentalEntries,
  showPanels,
  showChart,
  mergedItems,
  newsHeading,
  onRangeRequest,
  toggleIntraday,
} = useStockmarketItemData(props);
</script>

<template>
  <div class="stockmarket-item-response">
    <StockmarketItemHeader :title="data?.title" :subtitle="data?.subtitle" />

    <StockmarketItemDescription
      v-if="data?.shortDescription"
      :text="data.shortDescription"
    />

    <StockmarketItemRecommendation
      v-if="data?.recommendation"
      :recommendation="data.recommendation"
      :reasoning="data.recommendationReasoning"
    />

    <StockmarketItemPanels
      v-if="showPanels"
      :fundamentals="fundamentalEntries"
      :key-points="data?.keyPoints"
    />

    <ChartRow v-if="showChart">
      <D3UnifiedStockChart
        :history="displayHistory"
        :reference-lines="referenceLines"
        :markers="markers"
        :volume-profile="volumeProfile"
        :available-range="coverageForChart"
        :colormap="appStore.chartConfig.colormap"
        :default-config="appStore.chartConfig"
        :on-range-request="onRangeRequest"
        :intraday-active="intradayActive"
        :intraday-available="intradayAvailable"
        :on-intraday="toggleIntraday"
        :quote-price="data?.currentPrice"
        :quote-change="data?.change"
        :quote-change-p="data?.changeP"
      />
    </ChartRow>

    <VideoGallerySection
      :title="data?.videoGalleryTitle"
      :items="data?.videoGalleryItems"
    />

    <SourcesSection
      v-if="mergedItems.length"
      :items="mergedItems"
      :title="newsHeading"
    />
  </div>
</template>

<style scoped>
.stockmarket-item-response {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  padding: var(--spacing-4);
  background-color: var(--color-bg-secondary);
}
</style>
