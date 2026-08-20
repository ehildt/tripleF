<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import AsyncImage from '@/components/shared/ui/async-image/AsyncImage.vue';
import type { GalleryItem } from '@/types/harness-response-data.model';

import { useGalleryImageTile } from '../../../composables/use-gallery-image-tile.composable';
import MediaCaptionScrim from '../../media-caption-scrim/MediaCaptionScrim.vue';

const props = defineProps<{
  item: GalleryItem;
}>();

const { t } = useI18n();
const { src, label, isBroken, open, handleImageError } = useGalleryImageTile(
  props.item,
  t('common.imageFallback'),
);
</script>

<template>
  <li v-if="item.imageUrl" class="harness-gallery__item">
    <figure>
      <button
        type="button"
        class="harness-gallery__trigger"
        :class="{ 'harness-gallery__trigger--error': isBroken }"
        :aria-label="$t('common.viewFullSize', { label })"
        :data-gallery-src="src"
        @click.stop="open"
      >
        <AsyncImage
          :src="src"
          :alt="item.imageAlt || ''"
          @error="handleImageError"
        />
      </button>
      <MediaCaptionScrim
        v-if="item.title || item.caption"
        as="figcaption"
        class="harness-gallery__caption"
      >
        <strong v-if="item.title && item.title !== item.caption">{{
          item.title
        }}</strong>
        <p v-if="item.caption">{{ item.caption }}</p>
      </MediaCaptionScrim>
    </figure>
  </li>
</template>

<style scoped>
.harness-gallery__item figure {
  position: relative;
  margin: 0 auto;
  overflow: hidden;
  background: var(--color-bg-tertiary);
  display: flex;
  flex-direction: column;
  height: 100%;
  height: 360px;
  width: 80%;
}

.harness-gallery__trigger {
  all: unset;
  position: relative;
  display: block;
  width: 100%;
  cursor: zoom-in;
  background: var(--color-bg-tertiary);
  aspect-ratio: 4 / 3;
  flex: 1 1 auto;
  min-height: 180px;
}

.harness-gallery__trigger:focus-visible {
  outline: 2px solid var(--color-accent-primary);
  outline-offset: 2px;
}

.harness-gallery__trigger--error {
  cursor: default;
}

/* Overlay positioning and the scrim live in MediaCaptionScrim; the rules
   below style its slotted title/caption text. */
.harness-gallery__caption strong {
  display: block;
  color: var(--color-fg-primary);
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.harness-gallery__caption p {
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-fg-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.harness-gallery__caption a {
  color: var(--color-accent-primary);
  text-decoration: none;
  font-weight: 600;
}

.harness-gallery__caption a:hover {
  text-decoration: underline;
}
</style>
