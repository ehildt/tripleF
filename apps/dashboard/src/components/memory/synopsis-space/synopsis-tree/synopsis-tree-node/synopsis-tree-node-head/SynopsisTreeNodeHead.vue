<script setup lang="ts">
/**
 * The tree row's head: a full-width toggle button (chevron plus the title
 * row) that expands or collapses the node. The title row is the head's
 * fixed content — composed here and fed flat props, not exposed as a slot.
 */
import { ChevronRight } from '@lucide/vue';

import SynopsisTreeNodeTitleRow from '../synopsis-tree-node-title-row/SynopsisTreeNodeTitleRow.vue';
import type {
  SynopsisTreeNodeHeadEmits,
  SynopsisTreeNodeHeadProps,
} from './SynopsisTreeNodeHead.types';

defineProps<SynopsisTreeNodeHeadProps>();
const emit = defineEmits<SynopsisTreeNodeHeadEmits>();
</script>

<template>
  <button
    type="button"
    class="synopsis-tree-node-head"
    :title="
      expanded ? $t('common.collapseSection') : $t('common.expandSection')
    "
    :aria-expanded="expanded"
    @click="emit('toggle')"
  >
    <ChevronRight
      :size="14"
      class="synopsis-tree-node-head__chevron"
      :class="{ 'synopsis-tree-node-head__chevron--open': expanded }"
    />
    <SynopsisTreeNodeTitleRow
      :title="node.title"
      :level="node.level ?? 0"
      :member-count="node.memberCount"
    />
  </button>
</template>

<style scoped>
.synopsis-tree-node-head {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  width: 100%;
  padding: var(--spacing-1) 0;
  font: inherit;
  text-align: left;
  color: inherit;
  background: none;
  border: none;
  cursor: pointer;
}

.synopsis-tree-node-head__chevron {
  flex-shrink: 0;
  color: var(--color-fg-muted);
  transition:
    transform 0.2s ease,
    color 0.2s ease;
}

.synopsis-tree-node-head:hover .synopsis-tree-node-head__chevron {
  color: var(--color-fg-primary);
}

.synopsis-tree-node-head__chevron--open {
  transform: rotate(90deg);
}
</style>
