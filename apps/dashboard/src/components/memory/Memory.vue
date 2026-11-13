<script setup lang="ts">
/**
 * The top-level Memory tab: one constellation canvas per memory layer —
 * partition facts, cognition insights, and the shared encyclopedia — with a
 * submenu to switch spaces (default: encyclopedia). Configuration stays in
 * Settings; this page is the live view of what memory holds.
 */
import { Brain, Fingerprint, FolderTree, Layers, Network } from '@lucide/vue';
import { computed } from 'vue';

import MenuTabs from '@/components/shared/ui/menu-tabs/MenuTabs.vue';
import PanelLayout from '@/components/shared/ui/panel-layout/PanelLayout.vue';
import { useMemorySpaceSync } from '@/composables/use-memory-space-sync/use-memory-space-sync';
import { i18n } from '@/i18n/i18n';

import CognitionSpace from './cognition-space/CognitionSpace.vue';
import { useMemorySpaceSubtab } from './composables/use-memory-space-subtab';
import type { MemorySpaceSubtab } from './composables/use-memory-space-subtab.types';
import EncyclopediaSpace from './encyclopedia-space/EncyclopediaSpace.vue';
import PartitionSpace from './partition-space/PartitionSpace.vue';
import SynopsisSpace from './synopsis-space/SynopsisSpace.vue';
import TaxonomyManager from './taxonomy-manager/TaxonomyManager.vue';

const { activeSubtab, selectSubtab } = useMemorySpaceSubtab();

// Load the server-persisted memory ids while the tab is open; the store
// aborts the in-flight sync when KeepAlive deactivates this component.
useMemorySpaceSync();

const SUBTAB_ITEMS = computed(() => [
  {
    id: 'partition',
    label: i18n.global.t('common.settingsMemoryPartition'),
    icon: Brain,
  },
  {
    id: 'cognition',
    label: i18n.global.t('common.settingsMemoryCognition'),
    icon: Fingerprint,
  },
  {
    id: 'encyclopedia',
    label: i18n.global.t('common.settingsMemoryEncyclopedia'),
    icon: Network,
  },
  {
    id: 'synopsis',
    label: i18n.global.t('common.settingsMemorySynopsis'),
    icon: Layers,
  },
  {
    id: 'taxonomy',
    label: i18n.global.t('common.settingsMemoryTaxonomy'),
    icon: FolderTree,
  },
]);
</script>

<template>
  <PanelLayout class="memory-page">
    <MenuTabs
      class="memory-page__menu"
      variant="section"
      :items="SUBTAB_ITEMS"
      :active="activeSubtab"
      @select="selectSubtab($event as MemorySpaceSubtab)"
    />

    <PartitionSpace v-if="activeSubtab === 'partition'" />

    <CognitionSpace v-if="activeSubtab === 'cognition'" />

    <SynopsisSpace v-if="activeSubtab === 'synopsis'" />

    <TaxonomyManager v-if="activeSubtab === 'taxonomy'" />

    <EncyclopediaSpace v-if="activeSubtab === 'encyclopedia'" />
  </PanelLayout>
</template>

<style scoped>
.memory-page {
  display: flex;
  flex-direction: column;
  padding: var(--spacing-3);
  grid-column: 1 / -1;
}

.memory-page__menu {
  background-color: transparent;
}
</style>
