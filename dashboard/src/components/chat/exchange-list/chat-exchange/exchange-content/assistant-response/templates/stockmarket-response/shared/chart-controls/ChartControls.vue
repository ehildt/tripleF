<script setup lang="ts">
import { computed, ref, watch } from 'vue';

const props = defineProps<{
  /** Whether to show the range selector (1M / 3M / … / All). */
  showRange?: boolean;
  /** Initial active range (bars); e.g. 22 for a 1M default. */
  defaultBars?: number;
  /** Whether the 1D (intraday) view is currently active. */
  intradayActive?: boolean;
  /**
   * Whether intraday bars were streamed. When false the 1D button renders
   * disabled instead of silently doing nothing on click.
   */
  intradayAvailable?: boolean;
  /**
   * The range the visible window currently maps to ("1W"…"5Y", "All"), so
   * the buttons follow zoom/pan instead of only the last click.
   */
  activeRangeLabel?: string;
  /**
   * The capped range the user selected (bars, or null for All). Stays
   * highlighted while zooming in; the zoomed range shows in a second color.
   */
  selectedRangeBars?: number | null;
  /**
   * The loaded history's span in calendar days; range buttons beyond the
   * available data are hidden.
   */
  availableDays?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onReset?: () => void;
  /** Number of bars to show for a range selection. */
  onRange?: (bars: number) => void;
  /** Switch to/from the 1D intraday view. */
  onIntraday?: () => void;
}>();

const RANGES = [
  { label: '1W', bars: 5 },
  { label: '1M', bars: 22 },
  { label: '3M', bars: 66 },
  { label: '6M', bars: 132 },
  { label: '1Y', bars: 252 },
  { label: '2Y', bars: 504 },
  { label: '5Y', bars: 1260 },
];

/** The bar count (or null for All) each range label maps to. */
const LABEL_TO_BARS: Record<string, number | null> = {
  '1W': 5,
  '1M': 22,
  '3M': 66,
  '6M': 132,
  '1Y': 252,
  '2Y': 504,
  '5Y': 1260,
  All: null,
};

/** The calendar days a range needs (bars are trading days, ~1.4x calendar). */
function rangeDays(bars: number): number {
  return Math.ceil(bars * 1.4) + 10;
}

/**
 * The range buttons the loaded data actually covers: a button is shown only
 * when its window fits inside the available history (with a small buffer for
 * the trading-day conversion). "All" always stays.
 */
const visibleRanges = computed(() => {
  const availableDays = props.availableDays;
  if (!availableDays) return RANGES;
  return RANGES.filter((r) => rangeDays(r.bars) <= availableDays + 30);
});

const activeRange = ref<number | null>(props.defaultBars ?? null);

/**
 * The capped range the user selected (bars, or null for All): the engine's
 * selected range when the parent provides it, else the last clicked range.
 * This stays highlighted in the active color while the user zooms in.
 */
const selectedBars = computed<number | null>(() => {
  if (props.intradayActive) return null;
  if (props.selectedRangeBars !== undefined) return props.selectedRangeBars;
  return activeRange.value;
});

/**
 * The range the visible window currently maps to (bars, or null for All).
 * When it is narrower than the selected range (the user zoomed in), it is
 * highlighted in a second color; zooming back out removes that highlight.
 */
const zoomedBars = computed<number | null>(() => {
  if (props.intradayActive) return null;
  if (props.activeRangeLabel) {
    return LABEL_TO_BARS[props.activeRangeLabel] ?? null;
  }
  return null;
});

// Entering 1D clears the daily-range highlight so only 1D shows as active.
watch(
  () => props.intradayActive,
  (active) => {
    if (active) activeRange.value = null;
  },
);

function selectRange(bars: number | null): void {
  activeRange.value = bars;
  if (bars === null) props.onReset?.();
  else props.onRange?.(bars);
}

function zoomIn(): void {
  activeRange.value = null;
  props.onZoomIn?.();
}

function zoomOut(): void {
  activeRange.value = null;
  props.onZoomOut?.();
}

function zoomReset(): void {
  activeRange.value = null;
  props.onReset?.();
}
</script>

<template>
  <div class="chart-controls">
    <div class="chart-controls__buttons">
      <button
        v-if="onIntraday"
        type="button"
        class="chart-controls__button"
        :class="{ 'chart-controls__button--active': intradayActive }"
        :disabled="intradayAvailable === false"
        @click="onIntraday?.()"
      >
        1D
      </button>
      <template v-if="showRange">
        <button
          v-for="r in visibleRanges"
          :key="r.label"
          type="button"
          class="chart-controls__button"
          :class="{
            'chart-controls__button--active':
              selectedBars === r.bars && !intradayActive,
            'chart-controls__button--zoomed':
              zoomedBars === r.bars &&
              selectedBars !== r.bars &&
              !intradayActive,
          }"
          @click="selectRange(r.bars)"
        >
          {{ r.label }}
        </button>
        <button
          type="button"
          class="chart-controls__button"
          :class="{
            'chart-controls__button--active':
              selectedBars === null && !intradayActive,
            'chart-controls__button--zoomed':
              zoomedBars === null && selectedBars !== null && !intradayActive,
          }"
          @click="selectRange(null)"
        >
          {{ $t('common.all') }}
        </button>
      </template>
      <button
        type="button"
        class="chart-controls__button"
        :title="$t('common.zoomOut')"
        @click="zoomOut"
      >
        −
      </button>
      <button
        type="button"
        class="chart-controls__button"
        :title="$t('common.reset')"
        @click="zoomReset"
      >
        ⤾
      </button>
      <button
        type="button"
        class="chart-controls__button"
        :title="$t('common.zoomIn')"
        @click="zoomIn"
      >
        +
      </button>
    </div>
  </div>
</template>

<style scoped>
.chart-controls {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--spacing-2);
}

/* Reset the global .exchange-message div padding leak. */
.chart-controls.chart-controls {
  padding: 0;
}

.chart-controls__buttons {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
}

.chart-controls__button {
  padding: 0.15rem 0.5rem;
  font-size: 0.75rem;
  line-height: 1.2;
  color: var(--color-fg-muted);
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-divider);
  cursor: pointer;
}

/* Active state recolors the label/icon only — the button border stays the
   divider color so the controls read as a flat segmented row. */
.chart-controls__button--active {
  color: var(--color-accent-primary);
}

/* Unavailable options (e.g. 1D without intraday data) read muted and inert. */
.chart-controls__button:disabled {
  color: color-mix(in srgb, var(--color-fg-muted) 45%, transparent);
  cursor: not-allowed;
}

/* The zoomed-in range (narrower than the selected one) reads in a second
   color, so the selected range keeps its highlight while zooming. */
.chart-controls__button--zoomed {
  color: var(--color-status-info);
}
</style>
