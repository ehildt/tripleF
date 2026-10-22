<script setup lang="ts">
/**
 * The synopsis collapsible tree: the Raptor hierarchy as one nested list.
 * Rows render collapsed (heads only) by default; each row owns its summary
 * and children, revealed on expand.
 */
import { useSynopsisSpace } from '../composables/use-synopsis-space';
import SynopsisTreeNode from './synopsis-tree-node/SynopsisTreeNode.vue';

const { roots } = useSynopsisSpace();
</script>

<template>
  <ul class="synopsis-tree">
    <SynopsisTreeNode
      v-for="node in roots"
      :key="node.id"
      :node="node"
      class="synopsis-tree__row"
    />
  </ul>
</template>

<style scoped>
.synopsis-tree {
  margin: 0;
  padding: var(--spacing-3);
  list-style: none;
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-divider);
}

/* Outer chrome is parent-owned: the class lands on the node's root element,
   so the border survives a rename of the node's own BEM block. Nested rows
   (the node component's recursion) carry no passed class — no border. */
.synopsis-tree > .synopsis-tree__row + .synopsis-tree__row {
  border-top: 1px solid var(--color-divider);
}
</style>
