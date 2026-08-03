<script setup lang="ts">
import { X } from '@lucide/vue';

import MotionIcon from '../../motion-icon/MotionIcon.vue';

defineProps<{
  activeTitle?: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();
</script>

<template>
  <header class="lightbox__header">
    <h1 class="lightbox__title">
      {{ activeTitle && activeTitle.trim() ? activeTitle : 'Image' }}
    </h1>
    <div class="lightbox__header-actions">
      <slot name="actions" />
      <button type="button" class="lightbox__close" @click="emit('close')">
        <MotionIcon><X class="lightbox__close-icon" /></MotionIcon>
      </button>
    </div>
  </header>
</template>

<style scoped>
.lightbox__header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--spacing-2);
  text-indent: 0.5rem;
  border-bottom: 1px solid
    color-mix(in srgb, var(--color-divider) 70%, transparent);
  background: color-mix(in srgb, var(--color-bg-elevated) 35%, transparent);
}

.lightbox__header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  flex-shrink: 0;
}

/* Mobile: smaller text and icon */
@media (max-width: 639px) {
  .lightbox__title {
    font-size: 0.75rem;
  }

  .lightbox__close-icon {
    width: 1.25rem;
    height: 1.25rem;
  }
}

.lightbox__title {
  font-size: 0.875rem;
  color: var(--color-fg-primary);
  font-family: var(--font-sans);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lightbox__close {
  padding: var(--spacing-1);
  color: var(--color-fg-muted);
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.2s ease;
  flex-shrink: 0;
}

.lightbox__close:hover {
  color: var(--color-status-error);
}

.lightbox__close-icon {
  width: 1.5rem;
  height: 1.5rem;
}
</style>
