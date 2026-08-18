<script setup lang="ts">
/**
 * Single icon action button of the exchange header. The icon is provided via
 * the default slot (a lucide component); variants recolor the hover state.
 * Clicking triggers a brief pulse on the icon so the user gets immediate
 * feedback that the action registered.
 */
import { ref } from 'vue';

import Tooltip from '../../../../../shared/ui/tooltip/Tooltip.vue';

defineProps<{
  title: string;
  variant?: 'error' | 'danger';
  active?: boolean;
  /** Green selected state for the merge action. */
  selected?: boolean;
  /** Red state for exchanges consumed by a completed merge. */
  consumed?: boolean;
  /** Grayed out when a merge is impossible (fewer than two candidates). */
  disabled?: boolean;
  /** Pulsing animation when the merge is armed (2+ selected). */
  pulse?: boolean;
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
  <Tooltip :text="title">
    <button
      class="header-action"
      :class="{
        'header-action--error': variant === 'error',
        'header-action--danger': variant === 'danger',
        'header-action--active': active,
        'header-action--selected': selected,
        'header-action--consumed': consumed,
        'header-action--pulse': pulse,
        'header-action--pressed': pressed,
      }"
      :aria-label="title"
      :aria-pressed="selected ? true : undefined"
      :disabled="disabled"
      @click="handleClick"
      @mouseenter="emit('hoverStart')"
      @mouseleave="emit('hoverEnd')"
    >
      <slot />
    </button>
  </Tooltip>
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

/* Exchange consumed by a completed merge: red, still selectable. Declared
   before --selected so a fresh selection (green) wins over the red state. */
.header-action--consumed {
  color: var(--color-merge-consumed);
}

.header-action--consumed:hover {
  color: var(--color-merge-consumed);
}

/* Merge selection: green while the exchange is picked for consolidation. */
.header-action--selected {
  color: var(--color-merge-selected);
}

.header-action--selected:hover {
  color: var(--color-merge-selected);
}

/* No merge possible (fewer than two candidates): grayed out, inert. */
.header-action:disabled,
.header-action:disabled:hover {
  color: color-mix(in srgb, var(--color-fg-muted) 40%, transparent);
  cursor: not-allowed;
}

/* Armed merge (2+ selected): the picked icons pulse to signal readiness. */
@keyframes header-action-pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.55;
    transform: scale(1.18);
  }
}

.header-action--pulse :deep(svg) {
  animation: header-action-pulse 1.1s ease-in-out infinite;
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
