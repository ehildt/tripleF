<script setup lang="ts">
import type { VideoGalleryItem } from '@/types/harness-response-data.model';

import PlaylistItem from '../playlist-item/PlaylistItem.vue';
import type { PlaylistQueueProps } from './PlaylistQueue.types';

defineProps<PlaylistQueueProps>();

const emit = defineEmits<{
  play: [item: VideoGalleryItem];
  remove: [videoUrl: string];
}>();
</script>

<template>
  <div class="playlist-queue">
    <PlaylistItem
      v-for="(item, index) in videos"
      :key="`${item.videoUrl}-${index}`"
      :item="item"
      :is-active="activeVideoUrl === item.videoUrl"
      @play="emit('play', item)"
      @remove="emit('remove', item.videoUrl)"
    />
  </div>
</template>

<style scoped>
.playlist-queue {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  gap: var(--spacing-0-5);
}
</style>
