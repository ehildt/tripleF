<script setup lang="ts">
/**
 * The taxonomy manager: the user's rename/merge/icon surface over the
 * macro-taxonomy (cluster → community → hub, plus the tag vocabulary) of
 * one memory lane — the active partition, or the global encyclopedia. The
 * registry is read-only for the AI; every change here propagates across the
 * graph immediately (payloads rewrite, the old names stay as aliases), and
 * the constellation reflects it on its next read.
 */
import { Brain, FolderTree, Network, RefreshCw } from '@lucide/vue';
import { computed, onMounted } from 'vue';

import IconButton from '@/components/shared/ui/icon-button/IconButton.vue';
import SegmentedToggle from '@/components/shared/ui/segmented-toggle/SegmentedToggle.vue';
import { i18n } from '@/i18n/i18n';

import { TAXONOMY_ICON_NODES } from '../memory-constellation/helpers/taxonomy-icon-nodes.helper';
import { useTaxonomyManager } from './composables/use-taxonomy-manager';
import TaxonomyTierSection from './taxonomy-tier-section/TaxonomyTierSection.vue';

const {
  lane,
  tiers,
  isLoading,
  isUnavailable,
  isEmpty,
  editingId,
  nodeLabel,
  refresh,
  toggleEditing,
  renameNode,
  mergeNode,
  setIcon,
} = useTaxonomyManager();

/** The picker's icon names — the curated allowlist map keys. */
const iconNames = Object.keys(TAXONOMY_ICON_NODES);

const LANE_OPTIONS = computed(() => [
  {
    value: 'partition',
    icon: Brain,
    tooltip: i18n.global.t('common.settingsMemoryPartition'),
  },
  {
    value: 'encyclopedia',
    icon: Network,
    tooltip: i18n.global.t('common.settingsMemoryEncyclopedia'),
  },
]);

/** Localized per-tier copy, in display order. */
const tierCopy = computed<
  Record<string, { title: string; description: string }>
>(() => ({
  cluster: {
    title: i18n.global.t('common.memoryTaxonomyClusters'),
    description: i18n.global.t('common.memoryTaxonomyClustersDesc'),
  },
  community: {
    title: i18n.global.t('common.memoryTaxonomyCommunities'),
    description: i18n.global.t('common.memoryTaxonomyCommunitiesDesc'),
  },
  hub: {
    title: i18n.global.t('common.memoryTaxonomyHubs'),
    description: i18n.global.t('common.memoryTaxonomyHubsDesc'),
  },
  tag: {
    title: i18n.global.t('common.memoryTaxonomyTags'),
    description: i18n.global.t('common.memoryTaxonomyTagsDesc'),
  },
}));

onMounted(refresh);
</script>

<template>
  <main class="taxonomy-manager lg:col-span-12">
    <div class="taxonomy-manager__header">
      <div class="taxonomy-manager__icon">
        <FolderTree class="taxonomy-manager__icon-glyph" />
      </div>
      <div class="taxonomy-manager__content">
        <span class="taxonomy-manager__label">{{
          $t('common.memoryTaxonomyManager')
        }}</span>
        <span class="taxonomy-manager__description">{{
          $t('common.memoryTaxonomyManagerDesc')
        }}</span>
      </div>
      <div class="taxonomy-manager__actions">
        <SegmentedToggle
          v-model="lane"
          :options="LANE_OPTIONS"
          :aria-label="$t('common.memoryTaxonomyLane')"
        />
        <IconButton
          :title="$t('common.memoryTaxonomyRefresh')"
          size="sm"
          :disabled="isLoading"
          @click="refresh"
        >
          <RefreshCw :size="16" />
        </IconButton>
      </div>
    </div>

    <div v-if="isUnavailable" class="taxonomy-manager__state">
      {{ $t('common.memoryTaxonomyUnavailable') }}
    </div>
    <div v-else-if="isEmpty && !isLoading" class="taxonomy-manager__state">
      {{ $t('common.memoryTaxonomyEmpty') }}
    </div>

    <template v-else>
      <TaxonomyTierSection
        v-for="tier in tiers"
        :key="tier.kind"
        :tier="tier"
        :title="tierCopy[tier.kind]?.title ?? tier.kind"
        :description="tierCopy[tier.kind]?.description ?? ''"
        :editing-id="editingId"
        :node-label="nodeLabel"
        :icon-names="iconNames"
        @toggle-edit="toggleEditing"
        @rename="renameNode"
        @merge="mergeNode"
        @set-icon="setIcon"
      />
    </template>
  </main>
</template>

<style scoped>
.taxonomy-manager {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.taxonomy-manager__header {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3) var(--spacing-4);
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-divider);
  border-radius: var(--spacing-2);
}

.taxonomy-manager__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
  color: var(--color-fg-secondary);
  border: 1px solid var(--color-divider);
  border-radius: var(--spacing-1);
}

.taxonomy-manager__icon-glyph {
  width: 1rem;
  height: 1rem;
}

.taxonomy-manager__content {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.taxonomy-manager__label {
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-fg-primary);
}

.taxonomy-manager__description {
  font-size: 0.75rem;
  color: var(--color-fg-muted);
}

.taxonomy-manager__actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.taxonomy-manager__state {
  padding: var(--spacing-4);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-fg-muted);
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-divider);
  border-radius: var(--spacing-2);
}
</style>
