<script setup lang="ts">
/**
 * The leaf section of a node/tag view: the item's leaves load on mount and
 * render directly as presentational rows (link indicator, text, stamp,
 * outbound source). No head of its own: the item row's leaf stat chip
 * already carries the amount.
 */
import { useTaxonomyLeaves } from '../composables/use-taxonomy-leaves';
import TaxonomyLeafRow from './taxonomy-leaf-row/TaxonomyLeafRow.vue';
import type { TaxonomyLeavesPanelProps } from './TaxonomyLeavesPanel.types';

const props = defineProps<TaxonomyLeavesPanelProps>();

const { leaves, isLoading } = useTaxonomyLeaves(
  props.item.id,
  () => props.lane,
  () => props.scopeKey,
);
</script>

<template>
  <section class="taxonomy-leaves-panel">
    <p v-if="isLoading" class="taxonomy-leaves-panel__state">
      {{ $t('common.loading') }}…
    </p>
    <p
      v-if="!isLoading && leaves.length === 0"
      class="taxonomy-leaves-panel__state"
    >
      {{ $t('common.memoryTaxonomyLeavesEmpty') }}
    </p>

    <ul v-if="leaves.length > 0" class="taxonomy-leaves-panel__list">
      <TaxonomyLeafRow
        v-for="leaf in leaves"
        :key="leaf.id"
        :leaf="leaf"
        class="taxonomy-leaves-panel__row"
      />
    </ul>
  </section>
</template>

<style scoped>
.taxonomy-leaves-panel {
  border-top: 1px solid var(--color-divider);
}

.taxonomy-leaves-panel__state {
  margin: 0;
  padding: var(--spacing-2) var(--spacing-3);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-style: italic;
  color: var(--color-fg-muted);
}

.taxonomy-leaves-panel__list {
  margin: 0;
  padding: 0;
  list-style: none;
}

/* Outer chrome is parent-owned: the class lands on the row's root element,
   so the divider survives a rename of the row's own BEM block. */
.taxonomy-leaves-panel__row + .taxonomy-leaves-panel__row {
  border-top: 1px dashed var(--color-divider);
}
</style>
