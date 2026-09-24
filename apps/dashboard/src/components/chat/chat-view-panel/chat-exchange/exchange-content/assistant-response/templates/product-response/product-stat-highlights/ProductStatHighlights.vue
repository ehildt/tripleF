<script setup lang="ts">
/**
 * Big-number stat row for the specs buyers care about most — values divided
 * only by hairlines, no box — followed by the full label/value spec table.
 * Nothing is ever truncated.
 */
import type {
  KeyFinding,
  StatHighlight,
} from '@/types/harness-response-data.model';

import ProductSpecsList from '../product-specs-list/ProductSpecsList.vue';

defineProps<{
  stats?: readonly StatHighlight[];
  specItems?: readonly KeyFinding[];
}>();
</script>

<template>
  <section v-if="stats?.length || specItems?.length" class="stat-highlights">
    <ul v-if="stats?.length" class="stat-highlights__row">
      <li v-for="(stat, idx) in stats" :key="idx" class="stat-highlights__cell">
        <span class="stat-highlights__value">{{ stat.value }}</span>
        <span class="stat-highlights__label">{{ stat.label }}</span>
      </li>
    </ul>

    <ProductSpecsList v-if="specItems?.length" :items="specItems" />
  </section>
</template>

<style scoped>
.stat-highlights {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.stat-highlights__row {
  list-style: none;
  margin: 0;
  padding: var(--spacing-2) 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(7rem, 1fr));
  border-top: 1px solid var(--color-divider);
  border-bottom: 1px solid var(--color-divider);
}

.stat-highlights__cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-1);
  padding: 0 var(--spacing-1-5);
  text-align: center;
}

.stat-highlights__cell + .stat-highlights__cell {
  border-left: 1px solid var(--color-divider);
}

.stat-highlights__value {
  font-size: 1.4rem;
  font-weight: 700;
  line-height: 1.2;
  color: var(--color-fg-primary);
  overflow-wrap: anywhere;
}

.stat-highlights__label {
  font-size: 0.65rem;
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-fg-muted);
  overflow-wrap: anywhere;
}
</style>
