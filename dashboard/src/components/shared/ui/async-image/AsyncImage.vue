<script setup lang="ts">
/**
 * Async image atom shared by every image surface in the assistant response
 * (image tiles, gallery slides, related-story cards, product banner, shop
 * thumbs, hero media): the img itself plus the load state machine — a pulse
 * skeleton while the fetch is in flight, a fade-in once loaded, and a quiet
 * "Image unavailable" overlay on failure. The parent owns the box (aspect
 * ratio, click behavior, captions/overlays); AsyncImage fills it 100%.
 * Emits `load`/`error` so the parent can react (e.g. guarding a lightbox
 * click after an error).
 */
import { ref } from 'vue';

import type { AsyncImageProps } from './AsyncImage.types';

withDefaults(defineProps<AsyncImageProps>(), {
  alt: '',
  eager: false,
  fit: 'cover',
  showErrorLabel: true,
});

const emit = defineEmits<{ load: []; error: [] }>();

const isLoaded = ref(false);
const hasError = ref(false);

function handleLoad() {
  isLoaded.value = true;
  emit('load');
}

function handleError() {
  hasError.value = true;
  emit('error');
}
</script>

<template>
  <span class="async-image" :class="{ 'async-image--error': hasError }">
    <img
      :src="src"
      :alt="alt"
      :loading="eager ? 'eager' : 'lazy'"
      :fetchpriority="eager ? 'high' : undefined"
      decoding="async"
      class="async-image__img"
      :class="{
        'async-image__img--loaded': isLoaded,
        'async-image__img--error': hasError,
        'async-image__img--contain': fit === 'contain',
      }"
      @load="handleLoad"
      @error="handleError"
    />

    <!-- Pulse skeleton while the external image is still fetching: the tile
         pulses instead of flashing blank. -->
    <span
      v-if="!isLoaded && !hasError"
      class="async-image__skeleton"
      aria-hidden="true"
    />

    <!-- Quiet fallback on failure; suppressible for tiny thumbs. -->
    <span
      v-if="hasError && showErrorLabel"
      class="async-image__error"
      aria-hidden="true"
    >
      ⚠ {{ $t('common.imageUnavailable') }}
    </span>
  </span>
</template>

<style scoped>
.async-image {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: var(--color-bg-tertiary);
}

.async-image__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  opacity: 0;
  transition: opacity 0.2s ease;
}

/* Contain mode for square product thumbs. */
.async-image__img--contain {
  object-fit: contain;
}

/* Fade the real image in only once it has actually loaded — before that the
   skeleton below carries the tile so nothing blank flashes. */
.async-image__img--loaded {
  opacity: 1;
}

.async-image__img--error {
  opacity: 0;
}

.async-image__skeleton {
  position: absolute;
  inset: 0;
  background-color: var(--color-bg-tertiary);
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.async-image__error {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: var(--color-fg-muted);
  font-size: 0.85em;
}

/* Scoped (auto-renamed by Vue) so the pulse never depends on a global
   keyframes definition. */
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
