<script setup lang="ts">
/**
 * Single icon action button of the exchange header. The icon is provided via
 * the default slot (a lucide component); variants recolor the hover state.
 * Clicking triggers a brief pulse on the icon so the user gets immediate
 * feedback that the action registered.
 */
import { ref } from 'vue';

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

const pressed = ref(false);

function handleClick() {
  emit('click');
  pressed.value = true;
  window.setTimeout(() => {
    pressed.value = false;
  }, 300);
}
</script>

<template>
  <button
    class="header-action"
    :class="{
      'header-action--error': variant === 'error',
      'header-action--danger': variant === 'danger',
      'header-action--active': active,
      'header-action--pressed': pressed,
    }"
    :title="title"
    @click="handleClick"
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
}

/* Click feedback: a brief, subtle pulse on the icon. */
.header-action--pressed :deep(svg) {
  animation: header-action-pop 0.3s ease;
}

@keyframes header-action-pop {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}
</style>
