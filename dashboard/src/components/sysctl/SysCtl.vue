<script setup lang="ts">
import { computed, watch } from 'vue';

import { hidePopoutPreview } from '../chat/exchange-list/chat-exchange/exchange-content/assistant-response/composables/popout-settings.state';
import PanelHeader from '../shared/ui/panel-header/PanelHeader.vue';
import PanelHeaderTitle from '../shared/ui/panel-header-title/PanelHeaderTitle.vue';
import PanelLayout from '../shared/ui/panel-layout/PanelLayout.vue';
import { useSysctlHealthTiles } from './composables/use-sysctl-health-tiles';
import { type SysctlTab, useSysctlTab } from './composables/use-sysctl-tab';
import PreprocessingSection from './preprocessing-section/PreprocessingSection.vue';
import SearchEnginesSection from './search-engines-section/SearchEnginesSection.vue';
import SysCtlMenu from './sysctl-menu/SysCtlMenu.vue';
import SystemSection from './system-section/SystemSection.vue';
import WidgetsSection from './widgets-section/WidgetsSection.vue';

const { activeSysctlTab, selectSysctlTab } = useSysctlTab();
const { tiles } = useSysctlHealthTiles();

// The SysCtl popout preview is transient: switching the panel's own section
// (Search Engines → Preprocessing → Widgets → System) dismisses it too.
watch(activeSysctlTab, () => hidePopoutPreview());

const TAB_TITLES: Record<SysctlTab, string> = {
  'search-engines': 'Search Engines',
  preprocessing: 'Preprocessing',
  widgets: 'Widgets',
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

    <SystemSection v-else :tiles="tiles" />
  </PanelLayout>
</template>

<style scoped>
.sysctl {
  display: flex;
  flex-direction: column;
}
</style>
