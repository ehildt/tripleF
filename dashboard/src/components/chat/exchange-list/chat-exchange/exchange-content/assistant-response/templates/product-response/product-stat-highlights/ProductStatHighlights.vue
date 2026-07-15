<script setup lang="ts">
/**
 * Big-number stat row for the specs buyers care about most — values divided
 * only by hairlines, no box — with an expander that reveals the full
 * label/value spec table. Nothing is ever truncated.
 */
import type {
  KeyFinding,
  StatHighlight,
} from '@/types/harness-response-data.model';

import ProductSpecsList from '../product-specs-list/ProductSpecsList.vue';
import { useSpecsExpansion } from './composables/use-specs-expansion';

defineProps<{
  stats?: readonly StatHighlight[];
  specItems?: readonly KeyFinding[];
}>();

const { showAllSpecs, toggleSpecs } = useSpecsExpansion();
</script>

<template>
  <section v-if="stats?.length || specItems?.length" class="stat-highlights">
    <ul v-if="stats?.length" class="stat-highlights__row">
      <li v-for="(stat, idx) in stats" :key="idx" class="stat-highlights__cell">
        <span class="stat-highlights__value">{{ stat.value }}</span>
        <span class="stat-highlights__label">{{ stat.label }}</span>
      </li>
    </ul>

    <template v-if="specItems?.length">
      <button
        v-if="stats?.length"
        type="button"
        class="stat-highlights__toggle"
        :aria-expanded="showAllSpecs"
        @click="toggleSpecs"
      >
        {{ showAllSpecs ? 'Hide specs ▴' : 'Show all specs ▾' }}
      </button>
      <ProductSpecsList
        v-if="showAllSpecs || !stats?.length"
        :items="specItems"
      />
    </template>
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

.stat-highlights__toggle {
  align-self: center;
  padding: var(--spacing-1) var(--spacing-2);
  border: none;
  border-bottom: 1px solid transparent;
  background-color: transparent;
  font-size: 0.7rem;
  font-family: var(--font-mono);
  color: var(--color-fg-muted);
  cursor: pointer;
  transition:
    color 0.2s ease,
    border-color 0.2s ease;
}

.stat-highlights__toggle:hover {
  color: var(--color-accent-primary);
  border-bottom-color: var(--color-accent-primary);
}

.stat-highlights__toggle:focus-visible {
  outline: 2px solid var(--color-accent-primary);
  outline-offset: 1px;
}
</style>
