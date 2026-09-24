<script setup lang="ts">
import type { ToolbarListItemProps } from './ToolbarListItem.types';

const props = withDefaults(defineProps<ToolbarListItemProps>(), {
  isInactive: false,
  isInteractive: false,
});

const emit = defineEmits<{
  select: [];
}>();

function isFromNestedControl(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    target.closest('button, a, input, select, textarea') !== null
  );
}

function onRowClick(event: MouseEvent) {
  if (!props.isInteractive) return;
  if (isFromNestedControl(event.target)) return;
  emit('select');
}

function onRowKeydown(event: KeyboardEvent) {
  if (!props.isInteractive) return;
  if (event.key !== 'Enter' && event.key !== ' ') return;
  if (isFromNestedControl(event.target)) return;
  event.preventDefault();
  emit('select');
}
</script>

<template>
  <div
    class="toolbar-list-item"
    :class="{
      'toolbar-list-item--inactive': isInactive,
      'toolbar-list-item--interactive': isInteractive,
    }"
    :role="isInteractive ? 'button' : undefined"
    :tabindex="isInteractive ? 0 : undefined"
    @click="onRowClick"
    @keydown="onRowKeydown"
  >
    <slot />
  </div>
</template>

<style scoped>
.toolbar-list-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-1-5);
  padding: var(--spacing-2);
  font-size: 0.75rem;
  font-family: var(--font-mono);
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-divider);
  width: 100%;
  box-sizing: border-box;
  cursor: default;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    outline 0.2s ease;
}

.toolbar-list-item:focus-visible {
  outline: 2px solid var(--color-accent-primary);
  outline-offset: -1px;
}

.toolbar-list-item--inactive {
  opacity: 0.7;
}

.toolbar-list-item--interactive {
  cursor: pointer;
}

.toolbar-list-item--interactive:hover {
  background-color: color-mix(
    in srgb,
    var(--color-bg-tertiary) 80%,
    transparent
  );
}
</style>
