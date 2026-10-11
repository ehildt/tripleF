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
 *
 * The state machine reconciles from the DOM (`complete` + `naturalWidth`) on
 * mount and on `src` change, so an image that finishes before Vue observes
 * the load/error event (cached or synchronously decoded) can't leave the
 * skeleton pulsing over an image that is already visible.
 */
import { onMounted, ref, useTemplateRef, watch } from 'vue';

import type { AsyncImageProps } from './AsyncImage.types';

const props = withDefaults(defineProps<AsyncImageProps>(), {
  alt: '',
  eager: false,
  fit: 'cover',
  showErrorLabel: true,
});

const emit = defineEmits<{ load: []; error: [] }>();

const imgRef = useTemplateRef<HTMLImageElement>('imgRef');

const isLoaded = ref(false);
const hasError = ref(false);

/**
 * Idempotent state transitions: both the live event path and the DOM-fact
 * reconciliation funnel through these, so neither can double-fire the
 * parent's `load`/`error` reactions.
 */
function markLoaded() {
  if (isLoaded.value) return;
  isLoaded.value = true;
  emit('load');
}

function markError() {
  if (hasError.value) return;
  hasError.value = true;
  emit('error');
}

/**
 * Reconcile the state machine from the DOM instead of trusting events alone.
 * A cached or synchronously-decoded image can complete before Vue's listener
 * ever sees the `load`/`error` event; `complete` + `naturalWidth` tell us the
 * truth regardless of event timing (`complete` is also true on a broken
 * image, so `naturalWidth` is the success determinant).
 */
function syncLoadState() {
  const img = imgRef.value;
  if (!img || !img.complete) return;
  if (img.naturalWidth > 0) {
    markLoaded();
  } else if (props.src) {
    markError();
  }
}

onMounted(syncLoadState);

// A parent swapping `src` without remounting resets the machine and re-runs
// the DOM check post-render, so a cached swap never flashes the skeleton and
// an in-flight swap honestly shows loading again.
watch(
  () => props.src,
  () => {
    isLoaded.value = false;
    hasError.value = false;
    syncLoadState();
  },
  { flush: 'post' },
);
</script>

<template>
  <span class="async-image" :class="{ 'async-image--error': hasError }">
    <img
      ref="imgRef"
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
      @load="markLoaded"
      @error="markError"
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
