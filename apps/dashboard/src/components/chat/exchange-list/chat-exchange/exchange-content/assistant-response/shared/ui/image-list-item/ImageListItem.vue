<script setup lang="ts">
/**
 * One tile of the image grid: full-bleed image with a dimensions badge and a
 * hover overlay revealing title, caption, and source. Click opens the
 * lightbox through the shared inject.
 */
import { computed } from 'vue';

import AsyncImage from '@/components/shared/ui/async-image/AsyncImage.vue';
import type { GalleryItem } from '@/types/harness-response-data.model';

import { useGalleryImageTile } from '../../composables/use-gallery-image-tile.composable';
import { formatDimensions } from './helpers/format-dimensions.helper';

const props = defineProps<{
  item: GalleryItem;
}>();

const { src, label, isBroken, open, handleImageError } = useGalleryImageTile(
  props.item,
  'Image',
);

const dimensions = computed(() =>
  formatDimensions(props.item.width, props.item.height),
);
</script>

<template>
  <li class="image-item">
    <button
      type="button"
      class="image-item__trigger"
      :class="{ 'image-item__trigger--error': isBroken }"
      :aria-label="`View full size: ${label}`"
      @click="open"
    >
      <AsyncImage
        :src="src"
        :alt="item.imageAlt || ''"
        @error="handleImageError"
      />

      <span v-if="dimensions" class="image-item__badge">{{ dimensions }}</span>

      <span class="image-item__overlay">
        <strong v-if="item.title" class="image-item__title">{{
          item.title
        }}</strong>
        <span v-if="item.caption" class="image-item__caption">{{
          item.caption
        }}</span>
        <span v-if="item.source" class="image-item__source">{{
          item.source
        }}</span>
      </span>
    </button>
  </li>
</template>

<style scoped>
.image-item {
  display: flex;
  min-width: 0;
}

.image-item__trigger {
  all: unset;
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border: 1px solid var(--color-divider);
  background-color: var(--color-bg-tertiary);
  cursor: zoom-in;
  transition: border-color 0.2s ease;
}

.image-item__trigger:hover {
  border-color: var(--color-accent-border);
}

.image-item__trigger:focus-visible {
  outline: 2px solid var(--color-accent-primary);
  outline-offset: 2px;
}

.image-item__trigger--error {
  cursor: default;
}

.image-item__badge {
  position: absolute;
  top: var(--spacing-1);
  right: var(--spacing-1);
  padding: 0 var(--spacing-1);
  font-size: 0.65rem;
  font-family: var(--font-mono);
  color: white;
  background-color: color-mix(in srgb, black 70%, transparent);
}

.image-item__overlay {
  position: absolute;
  inset: auto 0 0 0;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  padding: var(--spacing-2) var(--spacing-3) var(--spacing-1-5)
    var(--spacing-1-5);
  background: linear-gradient(
    to top,
    color-mix(in srgb, black 80%, transparent),
    transparent
  );
  opacity: 0;
  transition: opacity 0.2s ease;
}

.image-item__trigger:hover .image-item__overlay,
.image-item__trigger:focus-visible .image-item__overlay {
  opacity: 1;
}

.image-item__title {
  font-size: 0.8rem;
  line-height: 1.3;
  color: white;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.image-item__caption {
  font-size: 0.7rem;
  line-height: 1.3;
  color: color-mix(in srgb, white 80%, transparent);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.image-item__source {
  font-size: 0.65rem;
  font-family: var(--font-mono);
  color: color-mix(in srgb, white 65%, transparent);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
