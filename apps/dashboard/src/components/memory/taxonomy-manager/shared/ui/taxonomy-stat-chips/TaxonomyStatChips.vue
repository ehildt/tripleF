<script setup lang="ts">
/**
 * The stat chips of a taxonomy row: leaves, linked, children — each an
 * icon plus a tabular count and a localized tooltip. The children chip
 * shows only on container tiers (childless rows carry no badge — PatternFly
 * rule); leaves/linked always render, muted at zero.
 */
import { FolderTree, Leaf, Link2 } from '@lucide/vue';
import { computed } from 'vue';

import { i18n } from '@/i18n/i18n';

import type { TaxonomyStatChipsProps } from './TaxonomyStatChips.types';

const props = defineProps<TaxonomyStatChipsProps>();

/** The chips to render: icon + tabular count + localized tooltip. */
const chips = computed(() => {
  const list = [
    {
      icon: Leaf,
      count: props.item.leafCount,
      title: i18n.global.t('common.memoryTaxonomyMetaLeaves', {
        count: props.item.leafCount,
      }),
    },
    {
      icon: Link2,
      count: props.item.linkedCount,
      title: i18n.global.t('common.memoryTaxonomyMetaLinked', {
        count: props.item.linkedCount,
      }),
    },
  ];
  if (props.item.childCount > 0) {
    list.push({
      icon: FolderTree,
      count: props.item.childCount,
      title: i18n.global.t('common.memoryTaxonomyMetaChildren', {
        count: props.item.childCount,
      }),
    });
  }
  return list;
});
</script>

<template>
  <span class="taxonomy-stat-chips">
    <span
      v-for="chip in chips"
      :key="chip.title"
      class="taxonomy-stat-chips__chip"
      :class="{ 'taxonomy-stat-chips__chip--muted': chip.count === 0 }"
      :title="chip.title"
    >
      <component :is="chip.icon" :size="12" />
      {{ chip.count }}
    </span>
  </span>
</template>

<style scoped>
.taxonomy-stat-chips {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-size: 0.625rem;
  color: var(--color-fg-secondary);
}

.taxonomy-stat-chips__chip {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  padding: 0.125rem var(--spacing-1);
  border: 1px solid var(--color-divider);
  background-color: var(--color-bg-secondary);
}

.taxonomy-stat-chips__chip--muted {
  color: var(--color-fg-muted);
  opacity: 0.7;
}
</style>
