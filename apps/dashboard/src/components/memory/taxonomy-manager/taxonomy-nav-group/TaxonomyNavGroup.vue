<script setup lang="ts">
/**
 * One tinted tier group of the taxonomy drill: a head (kind icon, tier
 * title, item count, tier description — all derived from the kind prop,
 * tinted by the harmony palette at the drill's tier colors) and the list
 * of navigation rows below it. Used at the drill root (clusters, hubs,
 * tags) and for a rotated item's child tiers.
 */
import { Boxes, FolderTree, Tags, Waypoints } from '@lucide/vue';
import { computed } from 'vue';

import SectionHeader from '@/components/shared/ui/section-header/SectionHeader.vue';
import { i18n } from '@/i18n/i18n';

import TaxonomyNavRow from '../taxonomy-nav-row/TaxonomyNavRow.vue';
import type { TaxonomyNavGroupProps } from './TaxonomyNavGroup.types';

const props = defineProps<TaxonomyNavGroupProps>();

const emit = defineEmits<{
  /** A navigation row was clicked — its item id. */
  select: [id: string];
}>();

/** Head content per tier kind: icon + localized tier title/description. */
const headContent = computed(() => {
  if (props.kind === 'node')
    return {
      icon: Waypoints,
      title: i18n.global.t('common.memoryTaxonomyNodes'),
      description: i18n.global.t('common.memoryTaxonomyNodesDesc'),
    };

  if (props.kind === 'hub')
    return {
      icon: Boxes,
      title: i18n.global.t('common.memoryTaxonomyHubs'),
      description: i18n.global.t('common.memoryTaxonomyHubsDesc'),
    };

  if (props.kind === 'tag')
    return {
      icon: Tags,
      title: i18n.global.t('common.memoryTaxonomyTags'),
      description: i18n.global.t('common.memoryTaxonomyTagsDesc'),
    };

  if (props.kind === 'community')
    return {
      icon: FolderTree,
      title: i18n.global.t('common.memoryTaxonomyCommunities'),
      description: i18n.global.t('common.memoryTaxonomyCommunitiesDesc'),
    };

  return {
    icon: FolderTree,
    title: i18n.global.t('common.memoryTaxonomyClusters'),
    description: i18n.global.t('common.memoryTaxonomyClustersDesc'),
  };
});
</script>

<template>
  <section class="taxonomy-nav-group">
    <div
      class="taxonomy-nav-group__head"
      :class="`taxonomy-nav-group__head--${kind}`"
    >
      <div class="taxonomy-nav-group__title">
        <SectionHeader :icon="headContent.icon" :title="headContent.title" />
        <span class="taxonomy-nav-group__count">{{ items.length }}</span>
      </div>
      <p class="taxonomy-nav-group__desc">{{ headContent.description }}</p>
    </div>
    <ul class="taxonomy-nav-group__list">
      <TaxonomyNavRow
        v-for="entry in items"
        :key="entry.id"
        :item="entry"
        :label="entry.name"
        @select="emit('select', entry.id)"
      />
    </ul>
  </section>
</template>

<style scoped>
.taxonomy-nav-group {
  display: flex;
  flex-direction: column;
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-divider);
}

.taxonomy-nav-group__head {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  padding: var(--spacing-3);
  border-bottom: 1px solid var(--color-divider);
  border-left: 2px solid transparent;
  background-color: var(--color-bg-elevated);
}

.taxonomy-nav-group__head--cluster {
  border-left-color: var(--color-harmony-1);
}

.taxonomy-nav-group__head--community {
  border-left-color: var(--color-harmony-2);
}

.taxonomy-nav-group__head--hub {
  border-left-color: var(--color-harmony-3);
}

.taxonomy-nav-group__head--node {
  border-left-color: var(--color-harmony-5);
}

.taxonomy-nav-group__head--tag {
  border-left-color: var(--color-harmony-4);
}

.taxonomy-nav-group__title {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.taxonomy-nav-group__count {
  padding: 0 var(--spacing-1);
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-size: 0.625rem;
  color: var(--color-fg-muted);
  border: 1px solid var(--color-divider);
  background-color: var(--color-bg-secondary);
}

.taxonomy-nav-group__desc {
  margin: 0;
  font-size: 0.75rem;
  color: var(--color-fg-muted);
}

.taxonomy-nav-group__list {
  margin: 0;
  padding: 0;
  list-style: none;
}
</style>
