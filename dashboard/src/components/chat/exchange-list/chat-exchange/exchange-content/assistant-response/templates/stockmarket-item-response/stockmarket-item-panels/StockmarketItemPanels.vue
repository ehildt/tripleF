<script setup lang="ts">
import type { KeyFinding } from '@/types/harness-response-data.model';

import KeyFindingsSection from '../../../sections/key-findings-section/KeyFindingsSection.vue';
import type { FundamentalEntry } from '../../stockmarket-response/helpers/build-fundamental-entries.helper';

/**
 * Two-panel row below the chart: fundamentals cards and key findings share
 * one field grid, so the chart spans the full width. Cards flow two per
 * row — fundamentals first, then findings. Presentational.
 */
defineProps<{
  fundamentals: FundamentalEntry[];
  keyPoints?: KeyFinding[];
}>();
</script>

<template>
  <div class="stockmarket-item-panels">
    <dl
      v-if="fundamentals.length"
      class="stockmarket-item-panels__fundamentals"
    >
      <div
        v-for="entry in fundamentals"
        :key="entry.key"
        class="stockmarket-item-panels__fundamental"
      >
        <dt class="stockmarket-item-panels__fundamental-label">
          {{ entry.label }}
        </dt>
        <dd class="stockmarket-item-panels__fundamental-value">
          {{ entry.value }}
        </dd>
      </div>
    </dl>
    <KeyFindingsSection :items="keyPoints" />
  </div>
</template>

<style scoped>
.stockmarket-item-panels {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--spacing-1);
}

/* The dl/section wrappers are structure-only; their cards are the grid
   items, so both the section and its list are flattened. */
.stockmarket-item-panels :deep(> .stockmarket-item-panels__fundamentals),
.stockmarket-item-panels :deep(> .key-findings) {
  display: contents;
}

.stockmarket-item-panels :deep(> .key-findings ul) {
  display: contents;
}

.stockmarket-item-panels__fundamentals {
  margin: 0;
  padding: 0;
}

.stockmarket-item-panels__fundamental {
  padding: var(--spacing-2) var(--spacing-3);
  font-family: var(--font-mono);
  text-align: center;
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-divider);
}

.stockmarket-item-panels__fundamental-label {
  display: block;
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-fg-muted);
  overflow-wrap: anywhere;
}

.stockmarket-item-panels__fundamental-value {
  display: block;
  margin: var(--spacing-0-5) 0 0;
  font-size: 0.9rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--color-fg-primary);
  overflow-wrap: anywhere;
}

/* Same colour rhythm as the key-findings tags and news dots. */
.stockmarket-item-panels__fundamental:nth-child(1)
  .stockmarket-item-panels__fundamental-value {
  color: var(--color-accent-primary);
}

.stockmarket-item-panels__fundamental:nth-child(2)
  .stockmarket-item-panels__fundamental-value {
  color: var(--color-harmony-1);
}

.stockmarket-item-panels__fundamental:nth-child(3)
  .stockmarket-item-panels__fundamental-value {
  color: var(--color-harmony-2);
}

.stockmarket-item-panels__fundamental:nth-child(4)
  .stockmarket-item-panels__fundamental-value {
  color: var(--color-harmony-3);
}

.stockmarket-item-panels__fundamental:nth-child(5)
  .stockmarket-item-panels__fundamental-value {
  color: var(--color-harmony-4);
}

@media (max-width: 40rem) {
  .stockmarket-item-panels {
    grid-template-columns: 1fr;
  }
}
</style>
