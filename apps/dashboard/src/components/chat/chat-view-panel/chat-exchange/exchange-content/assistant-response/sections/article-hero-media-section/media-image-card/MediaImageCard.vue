<script setup lang="ts">
/**
 * Eager-loading, full-bleed 16:9 image card for hero positions (LCP
 * candidate): the shared AsyncImage atom inside a clickable trigger. The
 * parent owns the box and captions; this component owns the click surface
 * and the failure guard (a broken image never opens the lightbox).
 */
import { ref } from 'vue';

import AsyncImage from '@/components/shared/ui/async-image/AsyncImage.vue';

import type {
  MediaImageCardEmits,
  MediaImageCardProps,
} from './MediaImageCard.types';

const props = defineProps<MediaImageCardProps>();

const emit = defineEmits<MediaImageCardEmits>();

const hasError = ref(false);

function handleClick() {
  if (hasError.value) return;
  emit('click', props.imageUrl, props.imageAlt || '');
}
</script>

<template>
  <button
    type="button"
    class="media-image-card"
    :class="{ 'media-image-card--error': hasError }"
    @click="handleClick"
  >
    <AsyncImage
      :src="imageUrl"
      :alt="imageAlt || ''"
      eager
      @error="hasError = true"
    />
  </button>
</template>

<style scoped>
.media-image-card {
  all: unset;
  position: relative;
  display: block;
  width: 100%;
  cursor: pointer;
  background: var(--color-bg-tertiary);
  aspect-ratio: 16 / 9;
}

.media-image-card--error {
  cursor: default;
}

.media-image-card:focus-visible {
  outline: 2px solid var(--color-accent-primary);
  outline-offset: 2px;
}
</style>
