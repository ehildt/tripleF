<script setup lang="ts">
/**
 * Shared media renderer for a single video player surface.
 *
 * Renders a native <video> for direct URLs, an <iframe> for embeddable
 * providers, or a fallback external-link anchor for unembeddable URLs.
 */
import { computed } from 'vue';

import type {
  PlayerTarget,
  VideoPlayerSurfaceProps,
} from './VideoPlayerSurface.types';

const props = defineProps<VideoPlayerSurfaceProps>();

const emit = defineEmits<{
  (e: 'setPlayerElement', el: PlayerTarget): void;
}>();

const playerKey = computed(() => props.remountKey ?? props.videoUrl);

function setPlayerElement(el: unknown): void {
  const target = el instanceof Element ? el : null;
  emit('setPlayerElement', target);
}
</script>

<template>
  <video
    v-if="isDirectVideo"
    :key="playerKey"
    :ref="setPlayerElement"
    :src="videoUrl"
    controls
    autoplay
    class="video-player-surface__player"
  />
  <iframe
    v-else-if="!isUnembeddable"
    :key="playerKey"
    :ref="setPlayerElement"
    :src="embedSrc"
    class="video-player-surface__player"
    frameborder="0"
    allowfullscreen
    allow="
      accelerometer;
      autoplay;
      clipboard-write;
      encrypted-media;
      gyroscope;
      picture-in-picture;
      compute-pressure *;
    "
  />
  <a
    v-else-if="isUnembeddable"
    :href="videoUrl"
    target="_blank"
    rel="noopener noreferrer"
    class="video-player-surface__fallback"
  >
    {{ $t('common.watchOnSource') }}
  </a>
</template>

<style scoped>
.video-player-surface__player {
  display: block;
  width: 100%;
  height: 100%;
  border: none;
}

.video-player-surface__fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--color-accent-primary);
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 600;
}
</style>
