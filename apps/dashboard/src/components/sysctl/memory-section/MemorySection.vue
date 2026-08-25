<script setup lang="ts">
/**
 * The SysCtl "Memory" tab: a submenu of four sub-sections — configuration
 * fields, then one constellation canvas per memory layer (partition facts,
 * cognition insights, shared lexicon chunks).
 */
import { Brain, Fingerprint, Network, SlidersHorizontal } from '@lucide/vue';
import { computed } from 'vue';

import { i18n } from '@/i18n/i18n';

import SysCtlSubMenu from '../shared/ui/sysctl-submenu/SysCtlSubMenu.vue';
import CognitionSpace from './cognition-space/CognitionSpace.vue';
import { useMemorySubtab } from './composables/use-memory-subtab';
import type { MemorySubtab } from './composables/use-memory-subtab.types';
import MemoryConfigPanel from './config-panel/MemoryConfigPanel.vue';
import LexiconSpace from './lexicon-space/LexiconSpace.vue';
import PartitionSpace from './partition-space/PartitionSpace.vue';

const { activeSubtab, selectSubtab } = useMemorySubtab();

const SUBTAB_ITEMS = computed(() => [
  {
    id: 'config',
    label: i18n.global.t('common.sysctlMemoryConfig'),
    icon: SlidersHorizontal,
  },
  {
    id: 'partition',
    label: i18n.global.t('common.sysctlMemoryPartition'),
    icon: Brain,
  },
  {
    id: 'cognition',
    label: i18n.global.t('common.sysctlMemoryCognition'),
    icon: Fingerprint,
  },
  {
    id: 'lexicon',
    label: i18n.global.t('common.sysctlMemoryLexicon'),
    icon: Network,
  },
]);
</script>

<template>
  <div class="memory-section">
    <SysCtlSubMenu
      :items="SUBTAB_ITEMS"
      :active="activeSubtab"
      @select="selectSubtab($event as MemorySubtab)"
    />

    <MemoryConfigPanel v-if="activeSubtab === 'config'" />

    <PartitionSpace v-else-if="activeSubtab === 'partition'" />

    <CognitionSpace v-else-if="activeSubtab === 'cognition'" />

    <LexiconSpace v-else />
  </div>
</template>

<style scoped>
.memory-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}
</style>
