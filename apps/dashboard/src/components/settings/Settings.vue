<script setup lang="ts">
import { computed, watch } from 'vue';

import { i18n } from '@/i18n/i18n';

import { hidePopoutPreview } from '../chat/exchange-list/chat-exchange/exchange-content/assistant-response/composables/popout-settings.state';
import PanelHeader from '../shared/ui/panel-header/PanelHeader.vue';
import PanelHeaderTitle from '../shared/ui/panel-header-title/PanelHeaderTitle.vue';
import PanelLayout from '../shared/ui/panel-layout/PanelLayout.vue';
import { hidePlaylistPreview } from '../widgets/floating-playlist/composables/playlist-settings.state';
import ChatNavigationSection from './chat-navigation-section/ChatNavigationSection.vue';
import { useSettingsHealthTiles } from './composables/use-settings-health-tiles';
import { useSettingsTab } from './composables/use-settings-tab';
import type { SettingsTab } from './composables/use-settings-tab.types';
import IntegrationsSection from './integrations-section/IntegrationsSection.vue';
import InterfaceSection from './interface-section/InterfaceSection.vue';
import LayoutsSection from './layouts-section/LayoutsSection.vue';
import MemorySection from './memory-section/MemorySection.vue';
import PreprocessingSection from './preprocessing-section/PreprocessingSection.vue';
import SettingsMenu from './settings-menu/SettingsMenu.vue';
import SystemSection from './system-section/SystemSection.vue';
import WidgetsSection from './widgets-section/WidgetsSection.vue';

const { activeSettingsTab, selectSettingsTab } = useSettingsTab();
const { tiles } = useSettingsHealthTiles();

// The Settings previews are transient: switching the panel's own section
// (Integrations → Preprocessing → … → System) dismisses them too.
watch(activeSettingsTab, () => {
  hidePopoutPreview();
  hidePlaylistPreview();
});

const TAB_TITLE_KEYS: Record<SettingsTab, string> = {
  integrations: 'common.settingsIntegrations',
  preprocessing: 'common.settingsPreprocessing',
  layouts: 'common.settingsLayouts',
  widgets: 'common.settingsWidgets',
  chat: 'common.settingsChatNavigation',
  interface: 'common.settingsInterface',
  memory: 'common.settingsMemory',
  system: 'common.settingsSystem',
};

const activeTabTitle = computed(() =>
  i18n.global.t(TAB_TITLE_KEYS[activeSettingsTab.value]),
);
</script>

<template>
  <PanelLayout class="settings">
    <PanelHeader>
      <PanelHeaderTitle :label="activeTabTitle" />
      <SettingsMenu
        :active-tab="activeSettingsTab"
        @select-tab="selectSettingsTab"
      />
    </PanelHeader>

    <IntegrationsSection v-if="activeSettingsTab === 'integrations'" />

    <PreprocessingSection v-else-if="activeSettingsTab === 'preprocessing'" />

    <LayoutsSection v-else-if="activeSettingsTab === 'layouts'" />

    <WidgetsSection v-else-if="activeSettingsTab === 'widgets'" />

    <ChatNavigationSection v-else-if="activeSettingsTab === 'chat'" />

    <InterfaceSection v-else-if="activeSettingsTab === 'interface'" />

    <MemorySection v-else-if="activeSettingsTab === 'memory'" />

    <SystemSection v-else :tiles="tiles" />
  </PanelLayout>
</template>

<style scoped>
.settings {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  padding: var(--spacing-3);
}
</style>
