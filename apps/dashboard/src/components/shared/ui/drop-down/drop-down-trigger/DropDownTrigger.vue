<script setup lang="ts">
import { ref } from 'vue';

import Tooltip from '../../tooltip/Tooltip.vue';
import type { DropDownTriggerProps } from './DropDownTrigger.types';

defineProps<DropDownTriggerProps>();

const emit = defineEmits<{
  toggle: [];
}>();

// The parent's useMenuPosition anchors the menu to this button — a genuine
// imperative DOM handle, exposed for the positioning composable.
const triggerEl = ref<HTMLButtonElement | null>(null);
defineExpose({ triggerEl });
</script>

<template>
  <button
    v-if="variant === 'labeled'"
    ref="triggerEl"
    class="drop-down-trigger"
    :class="{ 'drop-down-trigger--errored': errored }"
    :disabled="disabled"
    @click.stop="emit('toggle')"
  >
    <slot />
    <span class="drop-down-trigger__label">{{ label }}</span>
    <span class="drop-down-trigger__value">{{ valueText }}</span>
    <span v-if="errored" class="drop-down-trigger__error-icon">
      <slot name="error-icon" />
    </span>
  </button>
  <Tooltip
    v-else
    :text="$t('common.selectLabel', { label: label.toLowerCase() })"
  >
    <button
      ref="triggerEl"
      class="drop-down-trigger drop-down-trigger--icon-only"
      :class="{
        'drop-down-trigger--active': open,
        'drop-down-trigger--sm': size === 'sm',
      }"
      :disabled="disabled"
      :aria-label="$t('common.selectLabel', { label: label.toLowerCase() })"
      @click.stop="emit('toggle')"
    >
      <slot />
    </button>
  </Tooltip>
</template>

<style scoped>
.drop-down-trigger {
  width: 100%;
  padding: var(--spacing-1-5) var(--spacing-3);
  font-size: 0.75rem;
  font-family: var(--font-mono);
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-divider);
  color: var(--color-fg-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.drop-down-trigger:disabled {
  opacity: 0.5;
  cursor: default;
}

.drop-down-trigger:hover:not(:disabled) {
  color: var(--color-accent-primary);
}

/* The icon-only modifier strips the field look: no border, no background,
   muted icon that lightens on hover — the same color-only pattern the
   icon-button triggers and the right-side strip menus use. A background box
   behind a border-straddling strip icon reads as a styling defect. */
.drop-down-trigger--icon-only {
  width: auto;
  padding: var(--spacing-1);
  border: none;
  background: none;
  color: var(--color-fg-muted);
  transition: color 0.2s ease;
}

.drop-down-trigger--icon-only:disabled {
  opacity: 0.4;
}

.drop-down-trigger--icon-only:hover:not(:disabled) {
  color: var(--color-fg-primary);
}

.drop-down-trigger--active,
.drop-down-trigger--active:hover:not(:disabled) {
  color: var(--color-accent-primary);
}

/* Compact variant for the floating prompt-bar strips: the trigger padding
   shrinks to the 1rem hit box of the sm icon-button menu triggers. */
.drop-down-trigger--sm {
  padding: var(--spacing-0-5);
}

.drop-down-trigger__label {
  flex: 1;
  text-align: left;
}

.drop-down-trigger__value {
  font-size: 0.625rem;
  color: var(--color-fg-muted);
  font-family: var(--font-mono);
}

.drop-down-trigger--errored {
  border-color: var(--color-status-error);
}

.drop-down-trigger__error-icon {
  display: flex;
  align-items: center;
}
</style>
