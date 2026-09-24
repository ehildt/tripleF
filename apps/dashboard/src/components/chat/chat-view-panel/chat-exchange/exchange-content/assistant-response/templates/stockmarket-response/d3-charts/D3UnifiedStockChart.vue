<script setup lang="ts">
import {
  Bookmark,
  ChartArea,
  ChartCandlestick,
  ChartColumnStacked,
  ChartLine,
  MirrorRectangular,
  TableCellsSplit,
  Tag,
  WavesHorizontal,
  ZodiacAquarius,
} from '@lucide/vue';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { resolveChangeClass } from '../helpers/resolve-change-class.helper';
import ChartControls from '../shared/chart-controls/ChartControls.vue';
import ChartToggle from '../shared/chart-toggles/ChartToggle.vue';
import type { ChartToggleOption } from '../shared/chart-toggles/ChartToggleGroup.types';
import ChartToggleGroup from '../shared/chart-toggles/ChartToggleGroup.vue';
import ChartTooltip from '../shared/chart-tooltip/ChartTooltip.vue';
import { useD3UnifiedChart } from './composables/use-d3-unified-chart.composable';
import type {
  D3HeatmapVariant,
  D3PriceStyle,
  D3VolumeStyle,
} from './D3Chart.types';
import type { D3UnifiedStockChartProps } from './D3UnifiedStockChart.types';

const PRICE_STYLE_OPTIONS: ChartToggleOption<D3PriceStyle>[] = [
  { id: 'candles', labelKey: 'common.chartCandles', icon: ChartCandlestick },
  { id: 'line', labelKey: 'common.chartLine', icon: ChartLine },
  { id: 'area', labelKey: 'common.chartArea', icon: ChartArea },
];
const VOLUME_STYLE_OPTIONS: ChartToggleOption<D3VolumeStyle>[] = [
  { id: 'histogram', labelKey: 'common.chartVolume', icon: ChartColumnStacked },
  { id: 'heatmap', labelKey: 'common.chartHeatmap', icon: WavesHorizontal },
];
const HEATMAP_VARIANT_OPTIONS: ChartToggleOption<D3HeatmapVariant>[] = [
  { id: 'cells', labelKey: 'common.chartCells', icon: TableCellsSplit },
  { id: 'flow', labelKey: 'common.chartFlow', icon: ZodiacAquarius },
];
const MARKERS_LABEL_KEY = 'common.chartMarkers';
const REFERENCE_LINES_LABEL_KEY = 'common.chartReferenceLines';
const TOOLTIP_LABEL_KEY = 'common.chartTooltip';

const props = defineProps<D3UnifiedStockChartProps>();

const { t } = useI18n();

/** The chart canvas mount point, created by this component's template. */
const containerRef = ref<HTMLDivElement | null>(null);
/** Ref to the tooltip panel so the chart can measure its real size. */
const chartTooltipRef = ref<{ rootEl: HTMLElement | null } | null>(null);

const chart = useD3UnifiedChart({
  containerRef,
  tooltipRef: chartTooltipRef,
  history: computed(() => props.history),
  currency: computed(() => props.currency),
  referenceLines: computed(() => props.referenceLines),
  markers: computed(() => props.markers),
  volumeProfile: computed(() => props.volumeProfile),
  availableRange: computed(() => props.availableRange),
  colormap: computed(() => props.colormap),
  initialConfig: props.defaultConfig,
  onRangeRequest: props.onRangeRequest,
  intradayActive: computed(() => props.intradayActive),
  quotePrice: computed(() => props.quotePrice),
  quoteChange: computed(() => props.quoteChange),
  quoteChangeP: computed(() => props.quoteChangeP),
  t,
});

// Top-level refs so the template can read and assign them directly.
const {
  priceStyle,
  volumeStyle,
  heatmapVariant,
  showMarkers,
  showReferenceLines,
  showTooltip,
  tooltip,
  legend,
  changeLabel,
  rangeLabel,
  availableDays,
  selectedRangeBars,
  DEFAULT_RANGE_BARS,
  zoomIn,
  zoomOut,
  reset,
  setRange,
} = chart;
</script>

<template>
  <div class="unified-chart__wrap">
    <div class="unified-chart__menu">
      <div class="unified-chart__menu-quote">
        <template v-if="quotePrice !== undefined">
          <span class="unified-chart__price">{{ quotePrice }}</span>
          <span
            v-if="changeLabel"
            class="unified-chart__change"
            :class="`unified-chart__change--${resolveChangeClass(quoteChangeP)}`"
          >
            {{ changeLabel }}
          </span>
        </template>
        <span v-else-if="legend" class="unified-chart__legend">
          {{ legend }}
        </span>
      </div>
      <div class="unified-chart__menu-controls">
        <div class="unified-chart__toggles">
          <ChartToggleGroup
            v-model="priceStyle"
            class="unified-chart__toggle-group--price"
            :group-label="'Price style'"
            :options="PRICE_STYLE_OPTIONS"
          />
          <ChartToggleGroup
            v-model="volumeStyle"
            class="unified-chart__toggle-group--volume"
            :group-label="'Volume style'"
            :options="VOLUME_STYLE_OPTIONS"
          />
          <ChartToggleGroup
            v-model="heatmapVariant"
            class="unified-chart__toggle-group--heatmap"
            :group-label="'Heatmap variant'"
            :options="HEATMAP_VARIANT_OPTIONS"
            :disabled="volumeStyle !== 'heatmap'"
          />
          <div
            class="unified-chart__toggle-group unified-chart__toggle-group--annotations"
            role="group"
            aria-label="Reference lines"
          >
            <ChartToggle
              :active="showReferenceLines"
              :label="$t(REFERENCE_LINES_LABEL_KEY)"
              :icon="Tag"
              @click="showReferenceLines = !showReferenceLines"
            />
            <ChartToggle
              :active="showMarkers"
              :label="$t(MARKERS_LABEL_KEY)"
              :icon="Bookmark"
              @click="showMarkers = !showMarkers"
            />
            <ChartToggle
              :active="showTooltip"
              :label="$t(TOOLTIP_LABEL_KEY)"
              :icon="MirrorRectangular"
              @click="showTooltip = !showTooltip"
            />
          </div>
        </div>
        <ChartControls
          :show-range="true"
          :default-bars="DEFAULT_RANGE_BARS"
          :intraday-active="intradayActive"
          :intraday-available="intradayAvailable"
          :active-range-label="rangeLabel"
          :selected-range-bars="selectedRangeBars"
          :available-days="availableDays"
          :on-zoom-in="zoomIn"
          :on-zoom-out="zoomOut"
          :on-reset="reset"
          :on-range="setRange"
          :on-intraday="onIntraday"
        />
      </div>
    </div>
    <div class="unified-chart__canvas">
      <div ref="containerRef" class="unified-chart" />
      <ChartTooltip ref="chartTooltipRef" :tooltip="tooltip" />
    </div>
  </div>
</template>

<style scoped>
.unified-chart__wrap {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.unified-chart__menu {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-3);
}

.unified-chart__menu-quote {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-0-5);
  min-width: 0;
}

.unified-chart__price {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-fg-primary);
  white-space: nowrap;
}

.unified-chart__change {
  font-size: 0.85rem;
  white-space: nowrap;
}

.unified-chart__change--positive {
  color: var(--color-status-success);
}

.unified-chart__change--negative {
  color: var(--color-status-error);
}

.unified-chart__change--neutral {
  color: var(--color-fg-muted);
}

.unified-chart__legend {
  font-size: 0.85rem;
  color: var(--color-fg-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.unified-chart__menu-controls {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  min-width: 0;
  gap: var(--spacing-1);
}

.unified-chart__toggles {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: var(--spacing-1);
}

/* Reset the global .exchange-message div padding leak. */
.unified-chart__menu .unified-chart__toggles {
  padding: 0;
}

.unified-chart__toggle-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
}

/* Each toggle group has its own active hue, passed to ChartToggle via the
   --chart-toggle-active-color custom property. */
.unified-chart__toggle-group--price {
  --chart-toggle-active-color: var(--color-accent-primary);
}

.unified-chart__toggle-group--volume {
  --chart-toggle-active-color: var(--color-harmony-1);
}

.unified-chart__toggle-group--heatmap {
  --chart-toggle-active-color: var(--color-harmony-3);
}

.unified-chart__toggle-group--annotations {
  --chart-toggle-active-color: var(--color-harmony-2);
}

.unified-chart__canvas {
  position: relative;
  width: 100%;
  height: 20rem;
}

.unified-chart {
  width: 100%;
  height: 100%;
  user-select: none;
  -webkit-user-select: none;
}

/* Reset the global .exchange-message div padding leak so the svg fills the
   canvas exactly and the engine's size measurement matches the render. */
.unified-chart__canvas,
.unified-chart {
  padding: 0;
}

/* ---- D3 svg internals (created imperatively by the engine) ---- */

:deep(.d3-chart) {
  display: block;
  width: 100%;
  height: 100%;
  user-select: none;
  -webkit-user-select: none;
}

:deep(.d3-chart__grid line) {
  stroke: color-mix(in srgb, var(--color-fg-muted) 45%, transparent);
  stroke-dasharray: 4 4;
  shape-rendering: crispEdges;
}

/* Minor day lines render fainter than the major month/date lines. */
:deep(.d3-chart__grid line.d3-chart__vgrid--day) {
  stroke: color-mix(in srgb, var(--color-fg-muted) 25%, transparent);
}

:deep(.d3-chart__axis text) {
  fill: var(--color-fg-secondary);
  font-size: 11px;
}

:deep(.d3-chart__crosshair-line) {
  stroke: color-mix(in srgb, var(--color-fg-muted) 60%, transparent);
  stroke-dasharray: 4 4;
  shape-rendering: crispEdges;
}

:deep(.d3-chart__crosshair-label-bg) {
  fill: color-mix(in srgb, var(--color-bg-elevated) 92%, transparent);
  stroke: var(--color-divider);
  stroke-width: 1px;
}

:deep(.d3-chart__crosshair-label-text) {
  fill: var(--color-fg-secondary);
  font-size: 10px;
  text-anchor: middle;
}

:deep(.d3-chart__reference-line) {
  stroke-dasharray: 4 3;
}

/* Decorative heatmap layers must not intercept the crosshair. */
:deep(.d3-chart__heatmap-cell),
:deep(.d3-chart__flow-quad) {
  pointer-events: none;
}

:deep(.d3-chart__reference-badge-text) {
  font-size: 10px;
  font-weight: 600;
}

:deep(.d3-chart__marker-label) {
  font-size: 10px;
  font-weight: 600;
  paint-order: stroke;
  stroke: var(--color-bg-elevated);
  stroke-width: 3px;
  stroke-linejoin: round;
}
</style>
