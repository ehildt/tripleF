<script setup lang="ts">
/**
 * The Settings "Widgets" tab: settings for the floating widgets — the video
 * popout, the floating playlist, the toast notifications, and the
 * slide-out tab menu. A submenu jumps straight to the widget to configure.
 */
import type { LucideIcon } from '@lucide/vue';
import { Bell, ListVideo, PanelRight, PictureInPicture2 } from '@lucide/vue';
import { computed, ref } from 'vue';

import SettingsSubMenu from '@/components/shared/ui/settings-submenu/SettingsSubMenu.vue';
import { i18n } from '@/i18n/i18n';

import SettingsSection from '../shared/ui/settings-section/SettingsSection.vue';
import PlaylistPanel from './playlist-panel/PlaylistPanel.vue';
import TabMenuPanel from './tab-menu-panel/TabMenuPanel.vue';
import ToastPanel from './toast-panel/ToastPanel.vue';
import VideoPopoutPanel from './video-popout-panel/VideoPopoutPanel.vue';
import type { WidgetId } from './WidgetsSection.types';

const WIDGETS = computed<{ id: WidgetId; label: string; icon: LucideIcon }[]>(
  () => [
    {
      id: 'videoPopout',
      label: i18n.global.t('common.videoPopout'),
      icon: PictureInPicture2,
    },
    {
      id: 'playlist',
      label: i18n.global.t('common.floatingPlayer'),
      icon: ListVideo,
    },
    {
      id: 'toast',
      label: i18n.global.t('common.toastNotifications'),
      icon: Bell,
    },
    {
      id: 'tabMenu',
      label: i18n.global.t('common.tabMenuTitle'),
      icon: PanelRight,
    },
  ],
);

const activeWidget = ref<WidgetId>('videoPopout');
</script>

<template>
  <SettingsSection>
    <div class="widgets-section">
      <SettingsSubMenu
        :items="WIDGETS"
        :active="activeWidget"
        @select="activeWidget = $event as WidgetId"
      />

      <VideoPopoutPanel v-if="activeWidget === 'videoPopout'" />
      <PlaylistPanel v-else-if="activeWidget === 'playlist'" />
      <ToastPanel v-else-if="activeWidget === 'toast'" />
      <TabMenuPanel v-else />
    </div>
  </SettingsSection>
</template>

<style scoped>
.widgets-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}
</style>
