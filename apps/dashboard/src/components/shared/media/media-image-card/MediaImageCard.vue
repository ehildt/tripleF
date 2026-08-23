<script setup lang="ts">
/**
 * Eager-loading, full-bleed 16:9 image card for hero positions (LCP
 * candidate): the shared AsyncImage atom inside a clickable trigger. The
 * parent owns the box (aspect ratio, captions); this component owns the
 * click surface and the failure guard (a broken image never opens the
 * lightbox).
 */
import { ref } from 'vue';

import AsyncImage from '@/components/shared/ui/async-image/AsyncImage.vue';

const props = defineProps<{
  imageUrl: string;
  imageAlt?: string;
  title?: string;
  caption?: string;
}>();

const emit = defineEmits<{
  (e: 'click', imageUrl: string, imageAlt: string): void;
}>();

const hasError = ref(false);

function handleClick() {
  if (hasError.value) return;
  emit('click', props.imageUrl, props.imageAlt || '');
}

function handleImageError() {
  hasError.value = true;
}
</script>

<template>
  <button
    type="button"
    class="media-image-card__trigger"
    :class="{ 'media-image-card__trigger--error': hasError }"
    @click="handleClick"
  >
    <AsyncImage
      :src="imageUrl"
      :alt="imageAlt || ''"
      eager
      @error="handleImageError"
    />
  </button>
</template>

<style scoped>
.media-image-card__trigger {
  all: unset;
  position: relative;
  display: block;
  width: 100%;
  cursor: zoom-in;
  background: var(--color-bg-tertiary);
  aspect-ratio: 16 / 9;
}

.media-image-card__trigger--error {
  cursor: default;
}

.media-image-card__trigger:focus-visible {
  outline: 2px solid var(--color-accent-primary);
  outline-offset: 2px;
}
</style>
