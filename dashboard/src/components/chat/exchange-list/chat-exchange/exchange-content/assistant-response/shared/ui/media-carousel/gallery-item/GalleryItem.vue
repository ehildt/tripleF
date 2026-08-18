<script setup lang="ts">
import { inject, ref } from 'vue';

import type {
  GalleryItem,
  HarnessImageClickedHandler,
} from '@/types/harness-response-data.model';
import { harnessImageClickedKey } from '@/types/harness-response-data.model';

const props = defineProps<{
  item: GalleryItem;
}>();

const onImageClicked = inject<HarnessImageClickedHandler>(
  harnessImageClickedKey,
  () => undefined,
);
const hasError = ref(false);

const encodedSrc = encodeURI(props.item.imageUrl);
const label = props.item.imageAlt || props.item.title || 'Image';

function handleClick() {
  onImageClicked?.(props.item);
}

function handleImageError() {
  hasError.value = true;
}
</script>

<template>
  <li v-if="item.imageUrl" class="harness-gallery__item">
    <figure>
      <button
        type="button"
        class="harness-gallery__trigger"
        :class="{ 'harness-gallery__trigger--error': hasError }"
        :aria-label="`View full size: ${label}`"
        :data-gallery-src="encodedSrc"
        @click.stop="handleClick"
      >
        <img
          :src="encodedSrc"
          :alt="item.imageAlt || ''"
          loading="lazy"
          decoding="async"
          class="harness-gallery__thumb"
          :class="{ 'harness-gallery__thumb--error': hasError }"
          @error="handleImageError"
        />
      </button>
      <figcaption
        v-if="item.title || item.caption"
        class="harness-gallery__caption"
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

.harness-gallery__trigger img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: opacity 0.2s ease;
}

.harness-gallery__trigger--error {
  cursor: default;
}

.harness-gallery__thumb--error {
  opacity: 0;
}

.harness-gallery__trigger--error::after {
  content: '⚠ Image unavailable';
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: var(--color-fg-muted);
  font-size: 0.85em;
}

.harness-gallery__caption {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  padding: var(--spacing-1-5) var(--spacing-2);
  background: color-mix(in srgb, var(--color-bg-primary) 88%, transparent);
  opacity: 0.85;
}

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
