<script setup lang="ts">
/**
 * The tree head's label: the synopsis title, its Raptor level badge, and
 * the member count. Pure presentational leaf — it renders the flat values
 * it is given and knows nothing about the cluster record they came from.
 */
import type { SynopsisTreeNodeTitleRowProps } from './SynopsisTreeNodeTitleRow.types';

defineProps<SynopsisTreeNodeTitleRowProps>();
</script>

<template>
  <span class="synopsis-tree-node-title-row">
    <span class="synopsis-tree-node-title-row__title">{{ title }}</span>
    <span class="synopsis-tree-node-title-row__badge">
      {{ $t('common.memorySynopsisLevelLabel') }} {{ level }}
    </span>
    <span class="synopsis-tree-node-title-row__meta">
      {{ $t('common.memorySynopsisMembersLabel') }} {{ memberCount }}
    </span>
  </span>
</template>

<style scoped>
.synopsis-tree-node-title-row {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: var(--spacing-2);
  min-width: 0;
}

.synopsis-tree-node-title-row__title {
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-fg-primary);
}

.synopsis-tree-node-title-row__badge {
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

.synopsis-tree-node-title-row__meta {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  color: var(--color-fg-muted);
}
</style>
