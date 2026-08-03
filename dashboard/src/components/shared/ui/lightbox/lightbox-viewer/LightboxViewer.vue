<script setup lang="ts">
import { ChevronLeft, ChevronRight } from '@lucide/vue';

import MotionIcon from '../../motion-icon/MotionIcon.vue';

defineProps<{
  imageUrl: string;
  hasPrev: boolean;
  hasNext: boolean;
}>();

const emit = defineEmits<{
  (e: 'prev'): void;
  (e: 'next'): void;
}>();
</script>

<template>
  <div class="lightbox__viewer">
    <button
      type="button"
      :disabled="!hasPrev"
      class="lightbox__nav"
      @click.stop="emit('prev')"
    >
      <MotionIcon><ChevronLeft class="lightbox__nav-icon" /></MotionIcon>
    </button>

    <img :src="imageUrl" class="lightbox__image" @click.stop />

    <button
      type="button"
      :disabled="!hasNext"
      class="lightbox__nav"
      @click.stop="emit('next')"
    >
      <MotionIcon><ChevronRight class="lightbox__nav-icon" /></MotionIcon>
    </button>
  </div>
</template>

<style scoped>
.lightbox__viewer {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  gap: var(--spacing-2);
}

/* Mobile: reduce padding to give image more room */
@media (max-width: 639px) {
  .lightbox__viewer {
    padding: var(--spacing-1);
  }
}

/* Tablet and up: standard padding */
@media (min-width: 640px) {
  .lightbox__viewer {
    padding: var(--spacing-2);
  }
}

/* Desktop: generous padding for larger panels */
@media (min-width: 1024px) {
  .lightbox__viewer {
    padding: var(--spacing-3);
  }
}

.lightbox__nav {
  flex-shrink: 0;
  padding: var(--spacing-1);
  color: var(--color-fg-secondary);
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.lightbox__nav:hover:not(:disabled) {
  color: var(--color-accent-primary);
}

.lightbox__nav:disabled {
  opacity: 0.5;
  cursor: default;
}

/* Mobile: smaller nav icons for tight screens */
@media (max-width: 639px) {
  .lightbox__nav-icon {
    width: 1.25rem;
    height: 1.25rem;
  }
}

.lightbox__nav-icon {
  width: 2rem;
  height: 2rem;
}

/* The image boxes itself inside the stable viewer: flex-basis 0 + grow
   fixes its width, max-height caps its height — its intrinsic aspect ratio
   can never push the nav buttons or resize the panel. */
.lightbox__image {
  flex: 1 1 0;
  min-width: 0;
  min-height: 0;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  user-select: none;
  padding: 0.5rem;
}

/* Tablet and up: image gets proportional room within panel */
@media (min-width: 640px) {
  .lightbox__image {
    padding: var(--spacing-2);
  }
}

/* Desktop and up: maximize image display space */
@media (min-width: 1024px) {
  .lightbox__image {
    padding: var(--spacing-3);
  }
}
</style>
