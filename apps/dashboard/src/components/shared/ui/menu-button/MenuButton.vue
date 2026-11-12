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
        'menu-button--danger': danger,
        'menu-button--armed': armed,
        'menu-button--loading': loading,
      }"
      :role="selected !== undefined ? 'tab' : undefined"
      :aria-label="label"
      :aria-selected="selected"
      :aria-pressed="active"
      :aria-busy="loading"
      :disabled="disabled || loading"
      @click="emit('click')"
    >
      <MotionIcon v-if="icon">
        <component
          :is="icon"
          class="menu-button__icon"
          :class="{ 'menu-button__icon--loading': loading }"
        />
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

.menu-button--danger:hover:not(:disabled) {
  color: var(--color-status-error);
}

.menu-button--armed,
.menu-button--armed:hover:not(:disabled) {
  color: var(--color-status-error);
  background-color: color-mix(
    in srgb,
    var(--color-status-error) 20%,
    transparent
  );
  animation: pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.menu-button:disabled {
  opacity: 0.5;
  cursor: default;
}

.menu-button--loading:disabled {
  opacity: 1;
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

.menu-button__icon--loading {
  animation: menu-button-pulse 1.6s ease-in-out infinite;
}

@keyframes menu-button-pulse {
  0%,
  100% {
    color: var(--color-fg-muted);
    opacity: 0.65;
    transform: scale(0.92);
  }
  50% {
    color: var(--color-accent-primary);
    opacity: 1;
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .menu-button__icon--loading {
    animation: none;
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
