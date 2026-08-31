<script setup lang="ts">
/**
 * The top-level Memory tab: one constellation canvas per memory layer —
 * partition facts, cognition insights, and the shared encyclopedia — with a
 * submenu to switch spaces (default: encyclopedia). Configuration stays in
 * SysCtl; this page is the live view of what memory holds.
 */
import { Brain, Fingerprint, Network } from '@lucide/vue';
import { computed } from 'vue';

import SysCtlSubMenu from '@/components/shared/ui/sysctl-submenu/SysCtlSubMenu.vue';
import { i18n } from '@/i18n/i18n';

import CognitionSpace from './cognition-space/CognitionSpace.vue';
import { useMemorySpaceSubtab } from './composables/use-memory-space-subtab';
import type { MemorySpaceSubtab } from './composables/use-memory-space-subtab.types';
import EncyclopediaSpace from './encyclopedia-space/EncyclopediaSpace.vue';
import PartitionSpace from './partition-space/PartitionSpace.vue';

const { activeSubtab, selectSubtab } = useMemorySpaceSubtab();

const SUBTAB_ITEMS = computed(() => [
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
    id: 'encyclopedia',
    label: i18n.global.t('common.sysctlMemoryEncyclopedia'),
    icon: Network,
  },
]);
</script>

<template>
  <main class="memory-page lg:col-span-12">
    <SysCtlSubMenu
      :items="SUBTAB_ITEMS"
      :active="activeSubtab"
      @select="selectSubtab($event as MemorySpaceSubtab)"
    />

    <PartitionSpace v-if="activeSubtab === 'partition'" />

    <CognitionSpace v-else-if="activeSubtab === 'cognition'" />

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
