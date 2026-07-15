<script setup lang="ts">
import { ref } from 'vue';

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
    <img
      :src="imageUrl"
      :alt="imageAlt || ''"
      loading="eager"
      decoding="async"
      fetchpriority="high"
      class="media-image-card__img"
      :class="{ 'media-image-card__img--error': hasError }"
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

.media-image-card__trigger--error::after {
  content: '⚠ Image unavailable';
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: var(--color-fg-muted);
  font-size: 0.85em;
}

.media-image-card__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: opacity 0.2s ease;
}

.media-image-card__img--error {
  opacity: 0;
}
</style>
