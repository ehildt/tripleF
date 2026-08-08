<script setup lang="ts">
/**
 * The SysCtl "Widgets" tab: settings for the floating widgets — the video
 * popout, the floating playlist, the toast notifications, and the
 * slide-out tab menu. A submenu jumps straight to the widget to configure.
 */
import { LayoutGrid } from '@lucide/vue';
import { ref } from 'vue';

import { i18n } from '@/i18n/i18n';

import SysCtlSection from '../shared/ui/sysctl-section/SysCtlSection.vue';
import SysCtlSectionHeader from '../shared/ui/sysctl-section-header/SysCtlSectionHeader.vue';
import SysCtlSubMenu from '../shared/ui/sysctl-submenu/SysCtlSubMenu.vue';
import PlaylistPanel from './playlist-panel/PlaylistPanel.vue';
import TabMenuPanel from './tab-menu-panel/TabMenuPanel.vue';
import ToastPanel from './toast-panel/ToastPanel.vue';
import VideoPopoutPanel from './video-popout-panel/VideoPopoutPanel.vue';
import type { WidgetId } from './WidgetsSection.types';

const WIDGETS: { id: WidgetId; label: string }[] = [
  { id: 'videoPopout', label: i18n.global.t('common.videoPopout') },
  { id: 'playlist', label: i18n.global.t('common.floatingPlayer') },
  { id: 'toast', label: i18n.global.t('common.toastNotifications') },
  { id: 'tabMenu', label: i18n.global.t('common.tabMenuTitle') },
];

const activeWidget = ref<WidgetId>('videoPopout');
</script>

<template>
  <SysCtlSection>
    <div class="widgets-section">
      <SysCtlSectionHeader
        :icon="LayoutGrid"
        :title="$t('common.widgetsSection')"
      />

      <SysCtlSubMenu
        :items="WIDGETS"
        :active="activeWidget"
        @select="activeWidget = $event as WidgetId"
      />

      <VideoPopoutPanel v-if="activeWidget === 'videoPopout'" />
      <PlaylistPanel v-else-if="activeWidget === 'playlist'" />
      <ToastPanel v-else-if="activeWidget === 'toast'" />
      <TabMenuPanel v-else />
    </div>
  </SysCtlSection>
</template>

<style scoped>
.widgets-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}
</style>
