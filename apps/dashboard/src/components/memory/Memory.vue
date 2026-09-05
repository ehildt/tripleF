<script setup lang="ts">
/**
 * The top-level Memory tab: one constellation canvas per memory layer —
 * partition facts, cognition insights, and the shared encyclopedia — with a
 * submenu to switch spaces (default: encyclopedia). Configuration stays in
 * Settings; this page is the live view of what memory holds.
 */
import { Brain, Fingerprint, FolderTree, Layers, Network } from '@lucide/vue';
import { computed } from 'vue';

import SettingsSubMenu from '@/components/shared/ui/settings-submenu/SettingsSubMenu.vue';
import { i18n } from '@/i18n/i18n';

import CognitionSpace from './cognition-space/CognitionSpace.vue';
import { useMemorySpaceSubtab } from './composables/use-memory-space-subtab';
import type { MemorySpaceSubtab } from './composables/use-memory-space-subtab.types';
import EncyclopediaSpace from './encyclopedia-space/EncyclopediaSpace.vue';
import PartitionSpace from './partition-space/PartitionSpace.vue';
import SynopsisSpace from './synopsis-space/SynopsisSpace.vue';
import TaxonomyManager from './taxonomy-manager/TaxonomyManager.vue';

const { activeSubtab, selectSubtab } = useMemorySpaceSubtab();

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
  <main class="memory-page lg:col-span-12">
    <SettingsSubMenu
      :items="SUBTAB_ITEMS"
      :active="activeSubtab"
      @select="selectSubtab($event as MemorySpaceSubtab)"
    />

    <PartitionSpace v-if="activeSubtab === 'partition'" />

    <CognitionSpace v-else-if="activeSubtab === 'cognition'" />

    <SynopsisSpace v-else-if="activeSubtab === 'synopsis'" />

    <TaxonomyManager v-else-if="activeSubtab === 'taxonomy'" />

    <EncyclopediaSpace v-else />
  </main>
</template>

<style scoped>
.memory-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  padding: var(--spacing-3);
}
</style>
