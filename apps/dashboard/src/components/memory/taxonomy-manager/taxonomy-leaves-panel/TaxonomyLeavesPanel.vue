<script setup lang="ts">
/**
 * The leaf section of a node/tag view: the item's leaves load on mount and
 * render directly — rows with a linked indicator, the text (clamped to two
 * lines), the stamp, and an outbound link for encyclopedia chunks. No head
 * of its own: the item row's leaf stat chip already carries the amount.
 */
import { ExternalLink, Link2 } from '@lucide/vue';

import { useTaxonomyLeaves } from '../composables/use-taxonomy-leaves';
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
      <li
        v-for="leaf in leaves"
        :key="leaf.id"
        class="taxonomy-leaves-panel__row"
      >
        <Link2
          v-if="leaf.linked"
          :size="12"
          class="taxonomy-leaves-panel__linked"
          :title="$t('common.memoryTaxonomyLeafLinked')"
        />
        <p class="taxonomy-leaves-panel__text">{{ leaf.text }}</p>
        <span v-if="leaf.stampedAt" class="taxonomy-leaves-panel__date">{{
          leaf.stampedAt.slice(0, 10)
        }}</span>
        <a
          v-if="leaf.href"
          class="taxonomy-leaves-panel__source"
          :href="leaf.href"
          target="_blank"
          rel="noopener noreferrer"
          :title="$t('common.memoryTaxonomyLeafSource')"
        >
          <ExternalLink :size="12" />
        </a>
      </li>
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

.taxonomy-leaves-panel__row {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-2);
  padding: var(--spacing-1-5) var(--spacing-3);
  border-top: 1px dashed var(--color-divider);
}

.taxonomy-leaves-panel__list .taxonomy-leaves-panel__row:first-child {
  border-top: none;
}

.taxonomy-leaves-panel__linked {
  flex-shrink: 0;
  align-self: center;
  color: var(--color-accent-primary);
}

.taxonomy-leaves-panel__text {
  flex: 1;
  min-width: 0;
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  line-height: 1.5;
  color: var(--color-fg-primary);
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow-wrap: anywhere;
}

.taxonomy-leaves-panel__date {
  flex-shrink: 0;
  font-family: var(--font-mono);
  font-size: 0.625rem;
  color: var(--color-fg-muted);
}

.taxonomy-leaves-panel__source {
  flex-shrink: 0;
  align-self: center;
  display: inline-flex;
  color: var(--color-fg-muted);
  transition: color 0.2s ease;
}

.taxonomy-leaves-panel__source:hover {
  color: var(--color-accent-primary);
}
</style>
