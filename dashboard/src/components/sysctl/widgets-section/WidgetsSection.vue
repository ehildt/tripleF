<script setup lang="ts">
/**
 * The SysCtl "Widgets" tab: settings for the floating widgets — the video
 * popout, the toast notifications, and the slide-out tab menu.
 */
import TabMenuPanel from './tab-menu-panel/TabMenuPanel.vue';
import ToastPanel from './toast-panel/ToastPanel.vue';
import VideoPopoutPanel from './video-popout-panel/VideoPopoutPanel.vue';
</script>

<template>
  <div class="widgets-section">
    <VideoPopoutPanel />
    <ToastPanel />
    <TabMenuPanel />
  </div>
</template>

<style scoped>
.widgets-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  padding: var(--spacing-4);
}
</style>
