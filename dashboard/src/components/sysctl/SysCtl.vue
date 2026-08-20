<script setup lang="ts">
import { computed, watch } from 'vue';

import { i18n } from '@/i18n/i18n';

import { hidePopoutPreview } from '../chat/exchange-list/chat-exchange/exchange-content/assistant-response/composables/popout-settings.state';
import PanelHeader from '../shared/ui/panel-header/PanelHeader.vue';
import PanelHeaderTitle from '../shared/ui/panel-header-title/PanelHeaderTitle.vue';
import PanelLayout from '../shared/ui/panel-layout/PanelLayout.vue';
import { hidePlaylistPreview } from '../widgets/floating-playlist/composables/playlist-settings.state';
import ChatNavigationSection from './chat-navigation-section/ChatNavigationSection.vue';
import { useSysctlHealthTiles } from './composables/use-sysctl-health-tiles';
import { useSysctlTab } from './composables/use-sysctl-tab';
import type { SysctlTab } from './composables/use-sysctl-tab.types';
import InterfaceSection from './interface-section/InterfaceSection.vue';
import LayoutsSection from './layouts-section/LayoutsSection.vue';
import PreprocessingSection from './preprocessing-section/PreprocessingSection.vue';
import SearchEnginesSection from './search-engines-section/SearchEnginesSection.vue';
import SysCtlMenu from './sysctl-menu/SysCtlMenu.vue';
import SystemSection from './system-section/SystemSection.vue';
import WidgetsSection from './widgets-section/WidgetsSection.vue';

const { activeSysctlTab, selectSysctlTab } = useSysctlTab();
const { tiles } = useSysctlHealthTiles();

// The SysCtl previews are transient: switching the panel's own section
// (Search engines → Preprocessing → … → System) dismisses them too.
watch(activeSysctlTab, () => {
  hidePopoutPreview();
  hidePlaylistPreview();
});

const TAB_TITLE_KEYS: Record<SysctlTab, string> = {
  'search-engines': 'common.sysctlSearchEngines',
  preprocessing: 'common.sysctlPreprocessing',
  layouts: 'common.sysctlLayouts',
  widgets: 'common.sysctlWidgets',
  chat: 'common.sysctlChatNavigation',
  interface: 'common.sysctlInterface',
  system: 'common.sysctlSystem',
};

const activeTabTitle = computed(() =>
  i18n.global.t(TAB_TITLE_KEYS[activeSysctlTab.value]),
);
</script>

<template>
  <PanelLayout class="sysctl">
    <PanelHeader>
      <PanelHeaderTitle :label="activeTabTitle" />
      <SysCtlMenu :active-tab="activeSysctlTab" @select-tab="selectSysctlTab" />
    </PanelHeader>

    <SearchEnginesSection v-if="activeSysctlTab === 'search-engines'" />

    <PreprocessingSection v-else-if="activeSysctlTab === 'preprocessing'" />

    <LayoutsSection v-else-if="activeSysctlTab === 'layouts'" />

    <WidgetsSection v-else-if="activeSysctlTab === 'widgets'" />

    <ChatNavigationSection v-else-if="activeSysctlTab === 'chat'" />

    <InterfaceSection v-else-if="activeSysctlTab === 'interface'" />

    <SystemSection v-else :tiles="tiles" />
  </PanelLayout>
</template>

<style scoped>
.sysctl {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  padding: var(--spacing-3);
}
</style>
