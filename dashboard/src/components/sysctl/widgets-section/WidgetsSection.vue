<script setup lang="ts">
/**
 * The SysCtl "Widgets" tab: settings for the floating widgets — the video
 * popout and the toast notifications.
 */
import ToastPanel from './toast-panel/ToastPanel.vue';
import VideoPopoutPanel from './video-popout-panel/VideoPopoutPanel.vue';
</script>

<template>
  <div class="widgets-section">
    <VideoPopoutPanel />
    <ToastPanel />
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
