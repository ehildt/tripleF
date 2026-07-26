<script setup lang="ts">
import { computed } from 'vue';

import PanelHeader from '../shared/ui/panel-header/PanelHeader.vue';
import PanelHeaderTitle from '../shared/ui/panel-header-title/PanelHeaderTitle.vue';
import PanelLayout from '../shared/ui/panel-layout/PanelLayout.vue';
import { useSysctlHealthTiles } from './composables/use-sysctl-health-tiles';
import { type SysctlTab, useSysctlTab } from './composables/use-sysctl-tab';
import { useSysctlTabVisibility } from './composables/use-sysctl-tab-visibility';
import PreprocessingSection from './preprocessing-section/PreprocessingSection.vue';
import SearchEnginesSection from './search-engines-section/SearchEnginesSection.vue';
import SysCtlMenu from './sysctl-menu/SysCtlMenu.vue';
import SystemHealthSection from './system-health-section/SystemHealthSection.vue';
import TabVisibilitySection from './tab-visibility-section/TabVisibilitySection.vue';
import WidgetsSection from './widgets-section/WidgetsSection.vue';

const { activeSysctlTab, selectSysctlTab } = useSysctlTab();
const { tiles } = useSysctlHealthTiles();
const { isTabVisible, toggleTab, showCounters, toggleShowCounters } =
  useSysctlTabVisibility();

const TAB_TITLES: Record<SysctlTab, string> = {
  'search-engines': 'Search Engines',
  preprocessing: 'Preprocessing',
  widgets: 'Widgets',
  interface: 'Interface',
  system: 'System',
};

const activeTabTitle = computed(() => TAB_TITLES[activeSysctlTab.value]);
</script>

<template>
  <PanelLayout class="sysctl">
    <PanelHeader>
      <PanelHeaderTitle :label="`SysCtl :: ${activeTabTitle}`" />
      <SysCtlMenu :active-tab="activeSysctlTab" @select-tab="selectSysctlTab" />
    </PanelHeader>

    <SearchEnginesSection v-if="activeSysctlTab === 'search-engines'" />

    <PreprocessingSection v-else-if="activeSysctlTab === 'preprocessing'" />

    <WidgetsSection v-else-if="activeSysctlTab === 'widgets'" />

    <TabVisibilitySection
      v-else-if="activeSysctlTab === 'interface'"
      :is-debug-visible="isTabVisible('debug')"
      :is-dlq-visible="isTabVisible('dlq')"
      :is-sockets-visible="isTabVisible('sockets')"
      :show-counters="showCounters"
      @toggle-debug="toggleTab('debug')"
      @toggle-dlq="toggleTab('dlq')"
      @toggle-sockets="toggleTab('sockets')"
      @toggle-counters="toggleShowCounters"
    />

    <SystemHealthSection v-else :tiles="tiles" />
  </PanelLayout>
</template>

<style scoped>
.sysctl {
  display: flex;
  flex-direction: column;
}
</style>
