<script setup lang="ts">
import type { NodeDetailsMetadataProps } from './NodeDetailsMetadata.types';

defineProps<NodeDetailsMetadataProps>();
</script>

<template>
  <dl class="node-details-metadata">
    <div
      v-for="row in meta"
      :key="`${row.label}:${row.value}`"
      class="node-details-metadata__row"
    >
      <dt>{{ row.label }}</dt>
      <dd>{{ row.value }}</dd>
    </div>
  </dl>
</template>

<style scoped>
.node-details-metadata {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  margin: 0;
  padding: var(--spacing-2) var(--spacing-3);
  border-top: 1px solid var(--color-divider);
}

.node-details-metadata__row {
  display: flex;
  justify-content: space-between;
  gap: var(--spacing-3);
}

.node-details-metadata__row dt {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-fg-muted);
}

.node-details-metadata__row dd {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-fg-primary);
  text-align: right;
  overflow-wrap: anywhere;
}
</style>
