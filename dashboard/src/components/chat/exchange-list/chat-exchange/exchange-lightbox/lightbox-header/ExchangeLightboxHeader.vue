<script setup lang="ts">
import { X } from '@lucide/vue';

defineProps<{
  activeTitle?: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();
</script>

<template>
  <header class="exchange-lightbox__header">
    <h1 class="exchange-lightbox__title">
      {{ activeTitle && activeTitle.trim() ? activeTitle : 'Image' }}
    </h1>
    <button
      type="button"
      class="exchange-lightbox__close"
      @click="emit('close')"
    >
      <X class="exchange-lightbox__close-icon" />
    </button>
  </header>
</template>

<style scoped>
.exchange-lightbox__header {
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

/* Mobile: smaller text and icon */
@media (max-width: 639px) {
  .exchange-lightbox__title {
    font-size: 0.75rem;
  }

  .exchange-lightbox__close-icon {
    width: 1.25rem;
    height: 1.25rem;
  }
}

.exchange-lightbox__title {
  font-size: 0.875rem;
  color: var(--color-fg-primary);
  font-family: var(--font-sans);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.exchange-lightbox__close {
  padding: var(--spacing-1);
  color: var(--color-fg-muted);
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.2s ease;
  flex-shrink: 0;
}

.exchange-lightbox__close:hover {
  color: var(--color-status-error);
}

.exchange-lightbox__close-icon {
  width: 1.5rem;
  height: 1.5rem;
}
</style>
