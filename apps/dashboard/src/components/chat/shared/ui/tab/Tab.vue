<script setup lang="ts">
import type { TabProps } from './Tab.types';

defineProps<TabProps>();

const emit = defineEmits<{
  select: [];
}>();

function onPointerDown() {
  emit('select');
}

function onClick(event: MouseEvent) {
  // Keyboard activation (Enter/Space) has no pointerdown; mouse clicks do.
  // `detail` is 0 for keyboard-triggered clicks and >=1 for pointer clicks.
  if (event.detail === 0) {
    emit('select');
  }
}
</script>

<template>
  <div class="tab" :class="{ 'tab--active': isActive }">
    <button
      type="button"
      class="tab__select"
      @pointerdown="onPointerDown"
      @click="onClick"
    >
      <span class="tab__icon">
        <slot />
      </span>
      <span class="tab__label">{{ label }}</span>
    </button>
    <div v-if="$slots.menu" class="tab__menu">
      <slot name="menu" />
    </div>
  </div>
</template>

<style scoped>
.tab {
  flex: 1 1 0%;
  display: flex;
  align-items: stretch;
  gap: var(--spacing-1);
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: var(--color-fg-muted);
  background-color: var(--color-bg-secondary);
  border: none;
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}

.tab:hover {
  color: var(--color-fg-primary);
  background-color: var(--color-bg-tertiary);
}

.tab--active {
  color: var(--color-accent-primary);
  background-color: var(--color-bg-tertiary);
}

.tab__select {
  flex: 1 1 0%;
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  min-width: 0;
  padding: var(--spacing-2);
  border: none;
  background: transparent;
  color: inherit;
  font-family: inherit;
  font-size: inherit;
  cursor: pointer;
}

.tab__menu {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: var(--spacing-2);
  padding-left: 0;
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
