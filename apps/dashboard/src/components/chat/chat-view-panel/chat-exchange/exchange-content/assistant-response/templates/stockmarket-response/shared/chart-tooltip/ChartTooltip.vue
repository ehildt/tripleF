<script setup lang="ts">
import { computed, ref } from 'vue';

import type { ChartTooltipState } from './ChartTooltip.types';

const props = defineProps<{ tooltip: ChartTooltipState }>();

/** Anchor the panel to the cursor; `x`/`y` are already clamped by the composable. */
const style = computed(() => ({
  transform: `translate(${props.tooltip.x}px, ${props.tooltip.y}px)`,
}));

/** Always mounted (visibility-toggled) so the composable can measure its size. */
const rootEl = ref<HTMLDivElement | null>(null);
defineExpose({ rootEl });
</script>

<template>
  <div
    ref="rootEl"
    class="chart-tooltip shadow-floating"
    :class="{ 'chart-tooltip--visible': tooltip.visible }"
    :style="style"
    role="tooltip"
  >
    <div
      v-for="row in tooltip.rows"
      :key="row.label"
      class="chart-tooltip__row"
    >
      <span class="chart-tooltip__label">{{ row.label }}</span>
      <span
        class="chart-tooltip__value"
        :style="row.color ? { color: row.color } : undefined"
      >
        {{ row.value }}
      </span>
    </div>
  </div>
</template>

<style scoped>
/* Borderless frosted glass, like the app's floating tooltip/player panels: a
   translucent elevated surface with a backdrop blur and no frame, kept very
   transparent so the chart shows through. The chart rows carry their own
   colors (e.g. the green/red close), so the panel stays neutral. */
.chart-tooltip {
  position: absolute;
  top: 0;
  left: 0;
  min-width: 7.5rem;
  padding: var(--spacing-2) var(--spacing-3);
  background-color: color-mix(
    in srgb,
    var(--color-bg-secondary) 10%,
    transparent
  );
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 0.15s ease,
    visibility 0s linear 0.15s;
  pointer-events: none;
  z-index: 10;
}

.chart-tooltip--visible {
  opacity: 0.85;
  visibility: visible;
  transition: opacity 0.15s ease;
}

.chart-tooltip__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--spacing-3);
  font-size: 0.75rem;
  line-height: 1.5;
}

.chart-tooltip__label {
  color: var(--color-fg-muted);
}

.chart-tooltip__value {
  font-variant-numeric: tabular-nums;
  color: var(--color-fg-primary);
}
</style>
