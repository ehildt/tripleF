<script setup lang="ts">
/**
 * The drilled-in item's manage list of the taxonomy drill: the semantic
 * list wrapper (the row renders an `li`) around the current item's
 * TaxonomyItemRow — rename/merge/icon surface. The list earns its name by
 * owning the list chrome; the row's contract passes straight through and
 * all mutations emit upward, presentational only.
 */
import TaxonomyItemRow from '../taxonomy-item-row/TaxonomyItemRow.vue';
import type {
  TaxonomyItemListEmits,
  TaxonomyItemListProps,
} from './TaxonomyItemList.types';

defineProps<TaxonomyItemListProps>();
const emit = defineEmits<TaxonomyItemListEmits>();
</script>

<template>
  <ul class="taxonomy-item-list">
    <TaxonomyItemRow
      :item="item"
      :merge-candidates="mergeCandidates"
      :candidate-label="candidateLabel"
      :editing="editing"
      :icon-names="iconNames"
      @toggle-edit="emit('toggleEdit')"
      @rename="emit('rename', $event)"
      @merge="emit('merge', $event)"
      @set-icon="emit('setIcon', $event)"
    />
  </ul>
</template>

<style scoped>
.taxonomy-item-list {
  margin: 0;
  padding: 0;
  list-style: none;
}
</style>
