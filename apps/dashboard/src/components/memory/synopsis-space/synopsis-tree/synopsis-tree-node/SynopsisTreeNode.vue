<script setup lang="ts">
/**
 * One row of the synopsis collapsible tree: the head toggle (title with
 * its Raptor level badge and member count) and, once expanded, the summary
 * plus its children. Collapsed by default, the tree reads as a compact
 * list of heads; expanding a row reveals its synopsis and, for parents,
 * the nested children (themselves collapsed). Children render recursively,
 * indented by the nesting with a left guide border.
 */
import { computed } from 'vue';

import { useSynopsisSpace } from '../../composables/use-synopsis-space';
import { useSynopsisTree } from '../../composables/use-synopsis-tree';
import SynopsisTreeNodeHead from './synopsis-tree-node-head/SynopsisTreeNodeHead.vue';
import type { SynopsisTreeNodeProps } from './SynopsisTreeNode.types';

const props = defineProps<SynopsisTreeNodeProps>();

const { childrenByParent } = useSynopsisSpace();
const { isExpanded, toggle } = useSynopsisTree();

const children = computed<readonly (typeof props.node)[]>(
  () => childrenByParent.value.get(props.node.id) ?? [],
);
const hasChildren = computed(() => children.value.length > 0);
const expanded = computed(() => isExpanded(props.node.id));
</script>

<template>
  <li class="synopsis-tree-node">
    <SynopsisTreeNodeHead
      :node="node"
      :expanded="expanded"
      @toggle="toggle(node.id)"
    />

    <p v-if="expanded" class="synopsis-tree-node__summary">
      {{ node.summary }}
    </p>

    <ul v-if="hasChildren && expanded" class="synopsis-tree-node__children">
      <SynopsisTreeNode
        v-for="child in children"
        :key="child.id"
        :node="child"
      />
    </ul>
  </li>
</template>

<style scoped>
.synopsis-tree-node {
  display: flex;
  flex-direction: column;
}

.synopsis-tree-node__summary {
  margin: 0;
  padding: var(--spacing-1) 0 var(--spacing-2) calc(0.875rem + var(--spacing-1));
  font-size: 0.75rem;
  line-height: 1.5;
  color: var(--color-fg-secondary);
  overflow-wrap: anywhere;
}

.synopsis-tree-node__children {
  margin: 0 0 0 calc(0.625rem);
  padding: 0 0 0 var(--spacing-2);
  list-style: none;
  border-left: 1px solid var(--color-divider);
}
</style>
