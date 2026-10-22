<script setup lang="ts">
/**
 * The Settings "Widgets" tab: settings for the floating widgets — the video
 * popout, the floating playlist, the toast notifications, and the
 * slide-out tab menu. A submenu jumps straight to the widget to configure.
 * Sub-panel state lives in useWidgetPanel; this file only switches the
 * visible panel.
 */
import SettingsSection from '@/components/settings/shared/ui/settings-section/SettingsSection.vue';
import MenuTabs from '@/components/shared/ui/menu-tabs/MenuTabs.vue';

import { useWidgetPanel } from './composables/use-widget-panel';
import PlaylistPanel from './playlist-panel/PlaylistPanel.vue';
import TabMenuPanel from './tab-menu-panel/TabMenuPanel.vue';
import ToastPanel from './toast-panel/ToastPanel.vue';
import VideoPopoutPanel from './video-popout-panel/VideoPopoutPanel.vue';
import type { WidgetId } from './WidgetsSection.types';

const { widgets, activeWidget } = useWidgetPanel();
</script>

<template>
  <SettingsSection>
    <div class="widgets-section">
      <MenuTabs
        variant="section"
        :items="widgets"
        :active="activeWidget"
        @select="activeWidget = $event as WidgetId"
      />

      <VideoPopoutPanel v-if="activeWidget === 'videoPopout'" />
      <PlaylistPanel v-if="activeWidget === 'playlist'" />
      <ToastPanel v-if="activeWidget === 'toast'" />
      <TabMenuPanel v-if="activeWidget === 'tabMenu'" />
    </div>
  </SettingsSection>
</template>

<style scoped>
.widgets-section {
  display: flex;
  flex-direction: column;
  /* The sub tab strip owns the air below its line; no extra gap here, so
     the strip-to-actions spacing equals every other chrome-row spacing. */
  gap: 0;
}
</style>
