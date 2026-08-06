<script setup lang="ts">
/**
 * The SysCtl "Widgets" tab: settings for the floating widgets — the video
 * popout, the floating playlist, the toast notifications, and the
 * slide-out tab menu.
 */
import SysCtlSection from '../shared/ui/sysctl-section/SysCtlSection.vue';
import PlaylistPanel from './playlist-panel/PlaylistPanel.vue';
import TabMenuPanel from './tab-menu-panel/TabMenuPanel.vue';
import ToastPanel from './toast-panel/ToastPanel.vue';
import VideoPopoutPanel from './video-popout-panel/VideoPopoutPanel.vue';
</script>

<template>
  <SysCtlSection>
    <VideoPopoutPanel />
    <PlaylistPanel />
    <ToastPanel />
    <TabMenuPanel />
  </SysCtlSection>
</template>
