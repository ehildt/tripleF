<script setup lang="ts">
import { computed, ref } from 'vue';

import ChartControls from '../shared/chart-controls/ChartControls.vue';
import { DEFAULT_RANGE_BARS } from './composables/use-d3-chart.composable';
import { useD3StackedAreaChart } from './composables/use-d3-stacked-area-chart.composable';
import type { D3StackedAreaSeries } from './D3Chart.types';

const props = defineProps<{
  series: D3StackedAreaSeries[];
  /** normalized = each series rebased to 100; raw = original values. */
  mode?: 'normalized' | 'raw';
}>();

/** The chart canvas mount point, created by this component's template. */
const containerRef = ref<HTMLDivElement | null>(null);

const chart = useD3StackedAreaChart({
  containerRef,
  series: computed(() => props.series),
  mode: computed(() => props.mode),
});

// Top-level refs so the template can bind them directly.
const { STACKED_AREA_PALETTE, zoomIn, zoomOut, reset, setRange } = chart;
</script>

<template>
  <div class="stacked-area-chart">
    <ChartControls
      :show-range="true"
      :default-bars="DEFAULT_RANGE_BARS"
      :on-zoom-in="zoomIn"
      :on-zoom-out="zoomOut"
      :on-reset="reset"
      :on-range="setRange"
    />
    <div ref="containerRef" class="stacked-area-chart__canvas" />
    <ul v-if="series.length" class="stacked-area-chart__legend">
      <li
        v-for="(s, i) in series"
        :key="s.name"
        class="stacked-area-chart__legend-item"
      >
        <span
          class="stacked-area-chart__swatch"
          :style="{
            backgroundColor:
              STACKED_AREA_PALETTE[i % STACKED_AREA_PALETTE.length],
          }"
        />
        {{ s.name }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
.stacked-area-chart {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  user-select: none;
  -webkit-user-select: none;
}

.stacked-area-chart__canvas {
  width: 100%;
  height: 16rem;
}

/* Reset the global .exchange-message div padding leak so the svg fills the
   canvas exactly and the engine's size measurement matches the render. */
.stacked-area-chart__canvas {
  padding: 0;
}

.stacked-area-chart__legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2) var(--spacing-3);
  margin: 0;
  padding: 0;
  list-style: none;
}

.stacked-area-chart__legend-item {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-1);
  font-size: 0.8rem;
  color: var(--color-fg-muted);
}

.stacked-area-chart__swatch {
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;
}

/* ---- D3 svg internals (created imperatively by the engine) ---- */

:deep(.d3-chart) {
  display: block;
  width: 100%;
  height: 100%;
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
</style>
