<script setup lang="ts">
/**
 * The synopsis collapsible tree: the Raptor hierarchy as one nested list.
 * Root rows render expanded, deeper levels collapsed (seeded by the data
 * composable); each row owns its summary, folding only hides children.
 */
import { useSynopsisSpace } from '../composables/use-synopsis-space';
import SynopsisTreeNode from './synopsis-tree-node/SynopsisTreeNode.vue';

const { roots } = useSynopsisSpace();
</script>

<template>
  <ul class="synopsis-tree">
    <SynopsisTreeNode v-for="node in roots" :key="node.id" :node="node" />
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

.synopsis-tree > .synopsis-tree-node + .synopsis-tree-node {
  border-top: 1px solid var(--color-divider);
}
</style>
