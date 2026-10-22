<script setup lang="ts">
/**
 * One row of the synopsis collapsible tree: a chevron toggle (only when the
 * cluster has children), the title with its Raptor level badge and member
 * count, and the full summary — the synopsis itself, always readable.
 * Collapsing hides only the children, never the row's own summary. Children
 * render recursively, indented by the nesting with a left guide border.
 */
import { ChevronRight } from '@lucide/vue';
import { computed } from 'vue';

import { useSynopsisSpace } from '../../composables/use-synopsis-space';
import { useSynopsisTree } from '../../composables/use-synopsis-tree';
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
    <div class="synopsis-tree-node__head">
      <button
        v-if="hasChildren"
        type="button"
        class="synopsis-tree-node__toggle"
        :title="
          expanded ? $t('common.collapseSection') : $t('common.expandSection')
        "
        :aria-expanded="expanded"
        @click="toggle(node.id)"
      >
        <ChevronRight
          :size="14"
          class="synopsis-tree-node__chevron"
          :class="{ 'synopsis-tree-node__chevron--open': expanded }"
        />
      </button>
      <div class="synopsis-tree-node__title-row">
        <span class="synopsis-tree-node__title">{{ node.title }}</span>
        <span class="synopsis-tree-node__badge">
          {{ $t('common.memorySynopsisLevelLabel') }} {{ node.level ?? 0 }}
        </span>
        <span class="synopsis-tree-node__meta">
          {{ $t('common.memorySynopsisMembersLabel') }} {{ node.memberCount }}
        </span>
      </div>
    </div>

    <p class="synopsis-tree-node__summary">{{ node.summary }}</p>

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

.synopsis-tree-node__head {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  padding: var(--spacing-2) 0 0;
}

.synopsis-tree-node__toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
  padding: 0;
  color: var(--color-fg-muted);
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.2s ease;
}

.synopsis-tree-node__toggle:hover {
  color: var(--color-fg-primary);
}

.synopsis-tree-node__chevron {
  transition: transform 0.2s ease;
}

.synopsis-tree-node__chevron--open {
  transform: rotate(90deg);
}

.synopsis-tree-node__title-row {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: var(--spacing-2);
  min-width: 0;
}

.synopsis-tree-node__title {
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-fg-primary);
}

.synopsis-tree-node__badge {
  flex-shrink: 0;
  padding: 0 var(--spacing-1);
  font-family: var(--font-mono);
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-accent-primary);
  border: 1px solid
    color-mix(in srgb, var(--color-accent-primary) 40%, transparent);
}

.synopsis-tree-node__meta {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  color: var(--color-fg-muted);
}

.synopsis-tree-node__summary {
  margin: 0;
  padding: var(--spacing-1) 0 var(--spacing-2) calc(1.25rem + var(--spacing-1));
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
