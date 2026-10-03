<script setup lang="ts">
import type { TabProps } from './Tab.types';

defineProps<TabProps>();

const emit = defineEmits<{
  select: [];
}>();
</script>

<template>
  <div class="tab" :class="{ 'tab--active': isActive }">
    <button type="button" class="tab__select" @click="emit('select')">
      <span class="tab__icon">
        <slot />
      </span>
      <span class="tab__label">{{ label }}</span>
    </button>
  </div>
</template>

<style scoped>
.tab {
  position: relative;
  flex: 1 1 0%;
  display: flex;
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: var(--color-fg-muted);
  border: none;
}

/* The hover/active background lives on a dedicated layer and only its opacity
   transitions. Opacity is composited on the GPU thread; transitioning
   `background-color`/`color` directly would force a main-thread repaint every
   animation frame (the dropped-frame source on tab clicks). */
.tab::before {
  content: '';
  position: absolute;
  inset: 0;
  background-color: var(--color-bg-tertiary);
  opacity: 0;
  /* Promote the fade to its own compositor layer so the hover background
     animates on the GPU instead of repainting on the main thread. */
  will-change: opacity;
  transition: opacity 0.2s ease;
}

.tab:hover {
  color: var(--color-fg-primary);
}

.tab:hover::before {
  opacity: 1;
}

.tab--active {
  color: var(--color-accent-primary);
}

.tab--active::before {
  opacity: 1;
}

.tab__select {
  position: relative;
  flex: 1 1 0%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  width: 100%;
  height: 100%;
  min-width: 0;
  padding: var(--spacing-2);
  border: none;
  background: transparent;
  color: inherit;
  font-family: inherit;
  font-size: inherit;
  cursor: pointer;
}

.tab__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.tab__icon :deep(svg) {
  width: 0.75rem;
  height: 0.75rem;
}

.tab__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
