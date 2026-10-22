<script setup lang="ts">
/**
 * The metadata column chrome: it owns the aside (scroll, border, padding)
 * and the visibility branches. The populated half — label, rendered text,
 * download, frictions, evidence, tag chips — lives in
 * `NodeMetadataContent`; an empty hint shows until a dot is clicked.
 */
import NodeMetadataContent from './node-metadata-content/NodeMetadataContent.vue';
import type { NodeMetadataColumnProps } from './NodeMetadataColumn.types';

defineProps<NodeMetadataColumnProps>();
</script>

<template>
  <aside class="node-metadata-column">
    <NodeMetadataContent
      v-if="node"
      :node="node"
      :frictions="frictions"
      :tags="tags"
    />
    <p v-if="!node" class="node-metadata-column__empty">
      {{ $t('common.memoryMetadataEmpty') }}
    </p>
  </aside>
</template>

<style scoped>
.node-metadata-column {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  min-width: 0;
  padding: var(--spacing-3);
  overflow-y: auto;
  background-color: var(--color-bg-tertiary);
  border-left: 1px solid var(--color-divider);
}

.node-metadata-column__empty {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-style: italic;
  color: var(--color-fg-muted);
}
</style>
