<script setup lang="ts">
/**
 * The one button used inside menu rows (MenuRow, MenuTabs): a 2.5rem square
 * with a centered 1rem icon — or the label as mono text when no icon — over
 * the row's underline. It owns its whole look; rows and parents never
 * restyle it from the outside. Small icon buttons outside menu rows (cards,
 * list rows, tiles) use IconButton instead.
 */
import MotionIcon from '../motion-icon/MotionIcon.vue';
import Tooltip from '../tooltip/Tooltip.vue';
import type { MenuButtonEmits, MenuButtonProps } from './MenuButton.types';

defineProps<MenuButtonProps>();

const emit = defineEmits<MenuButtonEmits>();
</script>

<template>
  <Tooltip :text="tooltip ?? label" max-width="18rem">
    <button
      type="button"
      class="menu-button"
      :class="{
        'menu-button--active': active || selected,
        'menu-button--muted': muted,
      }"
      :role="selected !== undefined ? 'tab' : undefined"
      :aria-label="label"
      :aria-selected="selected"
      :aria-pressed="active"
      :disabled="disabled"
      @click="emit('click')"
    >
      <MotionIcon v-if="icon">
        <component :is="icon" class="menu-button__icon" />
      </MotionIcon>
      <span v-if="!icon">{{ label }}</span>
    </button>
  </Tooltip>
</template>

<style scoped>
.menu-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.5rem;
  height: 2.5rem;
  padding: 0 var(--spacing-1);
  flex-shrink: 0;
  border: none;
  border-bottom: 1px solid var(--color-divider);
  border-radius: 0;
  background: none;
  color: var(--color-fg-muted);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  cursor: pointer;
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}

.menu-button:hover:not(:disabled) {
  color: var(--color-fg-primary);
}

.menu-button--active,
.menu-button--active:hover:not(:disabled) {
  color: var(--color-accent-primary);
  border-bottom-color: var(--color-accent-primary);
}

.menu-button--muted {
  opacity: 0.55;
}

.menu-button--muted:hover:not(:disabled) {
  color: var(--color-fg-secondary);
  opacity: 0.8;
}

.menu-button:disabled {
  opacity: 0.5;
  cursor: default;
}

.menu-button:focus {
  outline: none;
}

.menu-button:focus-visible {
  outline: 1px solid var(--color-accent-primary);
  outline-offset: -1px;
}

.menu-button__icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}
</style>
