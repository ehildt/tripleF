<script setup lang="ts">
/**
 * The Settings "Memory" tab: an icon submenu (same pattern as Layouts
 * and the /memory canvases page) switches between the memory configuration
 * groups — spaces, short-term memory probe, cognition profile, constellation
 * diagram, maintenance models, auto-triggers, sweep limits. The constellation
 * canvases live on the top-level Memory page (/memory).
 */
import {
  BrainCircuit,
  Cpu,
  Database,
  Gauge,
  History,
  ListChecks,
  Network,
  Zap,
} from '@lucide/vue';
import { computed, ref } from 'vue';

import type { SubMenuItem } from '@/components/shared/ui/settings-submenu/SettingsSubMenu.types';
import SettingsSubMenu from '@/components/shared/ui/settings-submenu/SettingsSubMenu.vue';
import { i18n } from '@/i18n/i18n';

import SettingsSection from '../shared/ui/settings-section/SettingsSection.vue';
import type { MemoryGroupId } from './config-panel/MemoryConfigPanel.types';
import MemoryConfigPanel from './config-panel/MemoryConfigPanel.vue';

/**
 * One icon tab per configuration group; the icon mirrors the group's section
 * header so the selected tab and the visible header read as the same thing.
 */
const GROUP_ITEMS = computed<SubMenuItem[]>(() => [
  {
    id: 'spaces',
    label: i18n.global.t('common.memorySpacesSection'),
    icon: Database,
  },
  {
    id: 'episodeProbe',
    label: i18n.global.t('common.memoryEpisodeProbeSection'),
    icon: History,
  },
  {
    id: 'cognitionProfile',
    label: i18n.global.t('common.memoryCognitionProfileSection'),
    icon: Gauge,
  },
  {
    id: 'constellationDiagram',
    label: i18n.global.t('common.memoryDiagramSection'),
    icon: Network,
  },
  {
    id: 'maintenanceModels',
    label: i18n.global.t('common.memoryMaintenanceModels'),
    icon: Cpu,
  },
  {
    id: 'autoTriggers',
    label: i18n.global.t('common.memoryAutoTriggers'),
    icon: Zap,
  },
  {
    id: 'sweepLimits',
    label: i18n.global.t('common.memorySweepLimits'),
    icon: ListChecks,
  },
  {
    id: 'research',
    label: i18n.global.t('common.memoryResearchSection'),
    icon: BrainCircuit,
  },
]);

/** Which configuration group the submenu currently shows. */
const activeGroup = ref<MemoryGroupId>('spaces');
</script>

<template>
  <SettingsSection>
    <div class="memory-section">
      <SettingsSubMenu
        :items="GROUP_ITEMS"
        :active="activeGroup"
        @select="activeGroup = $event as MemoryGroupId"
      />

      <MemoryConfigPanel :active-group="activeGroup" />
    </div>
  </SettingsSection>
</template>

<style scoped>
.memory-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}
</style>
