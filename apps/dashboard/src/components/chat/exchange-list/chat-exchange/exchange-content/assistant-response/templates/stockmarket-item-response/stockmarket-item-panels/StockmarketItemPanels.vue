<script setup lang="ts">
import type { KeyFinding } from '@/types/harness-response-data.model';

import KeyFindingsSection from '../../../sections/key-findings-section/KeyFindingsSection.vue';
import { pickCycleColor } from '../../../shared/helpers/pick-cycle-color.helper';
import StatTile from '../../../shared/ui/stat-tile/StatTile.vue';
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
      <StatTile
        v-for="(entry, index) in fundamentals"
        :key="entry.key"
        as="div"
        :label="entry.label"
        :value="entry.value"
        :tint="pickCycleColor(index)"
      />
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

@media (max-width: 40rem) {
  .stockmarket-item-panels {
    grid-template-columns: 1fr;
  }
}
</style>
