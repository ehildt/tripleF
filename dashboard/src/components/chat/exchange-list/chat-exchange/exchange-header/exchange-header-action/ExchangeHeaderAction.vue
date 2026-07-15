<script setup lang="ts">
/**
 * Single icon action button of the exchange header. The icon is provided via
 * the default slot (a lucide component); variants recolor the hover state.
 */
defineProps<{
  title: string;
  variant?: 'error' | 'danger';
  active?: boolean;
}>();

const emit = defineEmits<{
  click: [];
  hoverStart: [];
  hoverEnd: [];
}>();
</script>

<template>
  <button
    class="header-action"
    :class="{
      'header-action--error': variant === 'error',
      'header-action--danger': variant === 'danger',
      'header-action--active': active,
    }"
    :title="title"
    @click="emit('click')"
    @mouseenter="emit('hoverStart')"
    @mouseleave="emit('hoverEnd')"
  >
    <slot />
  </button>
</template>

<style scoped>
.header-action {
  padding: var(--spacing-0-5);
  color: var(--color-fg-muted);
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.2s ease;
}

.header-action:hover {
  color: var(--color-accent-primary);
}

.header-action--error {
  color: var(--color-status-error);
}

.header-action--error:hover {
  color: var(--color-accent-primary);
}

.header-action--danger:hover {
  color: var(--color-status-error);
}

.header-action :deep(svg) {
  width: 0.75rem;
  height: 0.75rem;
}

.header-action--active :deep(svg) {
  transform: rotate(180deg);
  color: var(--color-accent-primary);
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
