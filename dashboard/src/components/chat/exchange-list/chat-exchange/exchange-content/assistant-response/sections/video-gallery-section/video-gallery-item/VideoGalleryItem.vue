<script setup lang="ts">
import { computed } from 'vue';

import type { VideoGalleryItem } from '@/types/harness-response-data.model';

import { toEmbedUrl } from '../../../composables/helpers/to-embed-url.helper.js';

const props = defineProps<{
  item: VideoGalleryItem;
}>();

const embedSrc = computed(() => toEmbedUrl(props.item.videoUrl) ?? '');
const isUnembeddable = computed(
  () => Boolean(props.item.videoUrl) && !embedSrc.value,
);
</script>

<template>
  <li v-if="item.videoUrl" class="video-gallery__item">
    <figure>
      <div class="video-gallery__video">
        <iframe
          v-if="embedSrc"
          :src="embedSrc"
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
        ></iframe>
        <a
          v-else-if="isUnembeddable"
          :href="item.videoUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="video-gallery__fallback"
        >
          Open video
        </a>
      </div>
      <figcaption
        v-if="item.title || item.caption"
        class="video-gallery__caption"
      >
        <strong v-if="item.title && item.title !== item.caption">{{
          item.title
        }}</strong>
        <p v-if="item.caption">{{ item.caption }}</p>
      </figcaption>
    </figure>
  </li>
</template>

<style scoped>
.video-gallery__item figure {
  margin: 0 auto;
  border: 1px solid var(--color-divider);
  border-radius: 6px;
  overflow: hidden;
  background: var(--color-bg-secondary);
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 240px;
  max-width: 560px;
  width: 100%;
}

.video-gallery__video {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  min-height: 180px;
  background: var(--color-bg-tertiary);
  flex: 1 1 auto;
}

.video-gallery__video iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}

.video-gallery__fallback {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-fg-primary);
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s ease;
}

.video-gallery__fallback:hover {
  color: var(--color-accent-primary);
  text-decoration: underline;
}

.video-gallery__caption {
  padding: var(--spacing-1-5) var(--spacing-2);
  font-size: 0.85em;
  color: var(--color-fg-muted);
}

.video-gallery__caption strong {
  display: block;
  color: var(--color-fg-primary);
  margin-bottom: 0.25em;
}

.video-gallery__caption p {
  margin: 0 0 0.5em;
}
</style>
