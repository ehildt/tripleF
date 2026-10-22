<script setup lang="ts">
import { computed, watch } from 'vue';

import type { MenuTabItem } from '@/components/shared/ui/menu-tabs/MenuTabs.types';
import MenuTabs from '@/components/shared/ui/menu-tabs/MenuTabs.vue';
import PanelHeader from '@/components/shared/ui/panel-header/PanelHeader.vue';
import PanelHeaderTitle from '@/components/shared/ui/panel-header-title/PanelHeaderTitle.vue';
import PanelLayout from '@/components/shared/ui/panel-layout/PanelLayout.vue';
import { i18n } from '@/i18n/i18n';
import { usePlaylistStore } from '@/stores/playlist/playlist.store';
import { usePopoutSettingsStore } from '@/stores/popout-settings/popout-settings.store';

import ChatNavigationSection from './chat-navigation-section/ChatNavigationSection.vue';
import { useSettingsHealthTiles } from './composables/use-settings-health-tiles';
import { useSettingsTab } from './composables/use-settings-tab';
import type { SettingsTab } from './composables/use-settings-tab.types';
import IntegrationsSection from './integrations-section/IntegrationsSection.vue';
import InterfaceSection from './interface-section/InterfaceSection.vue';
import LayoutsSection from './layouts-section/LayoutsSection.vue';
import MemorySection from './memory-section/MemorySection.vue';
import PreprocessingSection from './preprocessing-section/PreprocessingSection.vue';
import SystemSection from './system-section/SystemSection.vue';
import WidgetsSection from './widgets-section/WidgetsSection.vue';
import { SETTINGS_TAB_ITEMS } from './settings-tab-items.constant';

const { activeSettingsTab, activeTabTitle, selectSettingsTab } =
  useSettingsTab();
const { tiles } = useSettingsHealthTiles();
const popoutSettingsStore = usePopoutSettingsStore();
const playlistStore = usePlaylistStore();

/**
 * The settings panel's top tab menu: the shared tab items translated into
 * MenuTabs items (labels translated at the consumer — constants stay data).
 */
const settingsMenuItems = computed<MenuTabItem[]>(() =>
  SETTINGS_TAB_ITEMS.map((item) => ({
    id: item.tab,
    label: i18n.global.t(item.labelKey),
    icon: item.icon,
  })),
);

// The Settings previews are transient: switching the panel's own section
// (Integrations → Preprocessing → … → System) dismisses them too.
watch(activeSettingsTab, () => {
  popoutSettingsStore.hidePopoutPreview();
  playlistStore.hidePlaylistPreview();
});
</script>

<template>
  <PanelLayout class="settings">
    <PanelHeader>
      <PanelHeaderTitle :label="activeTabTitle" />
      <MenuTabs
        variant="header"
        :items="settingsMenuItems"
        :active="activeSettingsTab"
        @select="selectSettingsTab($event as SettingsTab)"
      />
    </PanelHeader>

    <IntegrationsSection v-if="activeSettingsTab === 'integrations'" />

    <PreprocessingSection v-if="activeSettingsTab === 'preprocessing'" />

    <LayoutsSection v-if="activeSettingsTab === 'layouts'" />

    <WidgetsSection v-if="activeSettingsTab === 'widgets'" />

    <ChatNavigationSection v-if="activeSettingsTab === 'chat'" />

    <InterfaceSection v-if="activeSettingsTab === 'interface'" />

    <MemorySection v-if="activeSettingsTab === 'memory'" />

    <SystemSection v-if="activeSettingsTab === 'system'" :tiles="tiles" />
  </PanelLayout>
</template>

<style scoped>
.settings {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  padding: var(--spacing-3);
  grid-column: 1 / -1;
}
</style>
