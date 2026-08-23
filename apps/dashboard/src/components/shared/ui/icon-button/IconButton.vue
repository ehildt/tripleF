<script setup lang="ts">
import MotionIcon from '../motion-icon/MotionIcon.vue';
import Tooltip from '../tooltip/Tooltip.vue';
import type { IconButtonProps } from './IconButton.types';

defineProps<IconButtonProps>();

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void;
  (e: 'mouseenter'): void;
  (e: 'mouseleave'): void;
  (e: 'focus'): void;
  (e: 'blur'): void;
}>();
</script>

<template>
  <Tooltip
    :text="title ?? ''"
    :disabled="disabled"
    :positions="tooltipPositions"
  >
    <!-- Rich tooltip content (e.g. title + description + caption) for the
         rare buttons whose tooltip is more than a label. Falls back to the
         `title` prop when the slot is absent. -->
    <template v-if="$slots['tooltip-content']" #content>
      <slot name="tooltip-content" />
    </template>
    <button
      type="button"
      class="icon-button"
      :class="{
        'icon-button--sm': size === 'sm',
        'icon-button--lg': size === 'lg',
        'icon-button--active': active,
        'icon-button--danger': danger,
        'icon-button--armed': armed,
        'icon-button--blinking': blinking,
      }"
      :aria-label="ariaLabel ?? title"
      :aria-pressed="ariaPressed"
      :disabled="disabled"
      @click="emit('click', $event)"
      @mouseenter="emit('mouseenter')"
      @mouseleave="emit('mouseleave')"
      @focus="emit('focus')"
      @blur="emit('blur')"
    >
      <MotionIcon>
        <span class="icon-button__icon">
          <slot />
        </span>
      </MotionIcon>
    </button>
  </Tooltip>
</template>

<style scoped>
.icon-button {
  display: flex;
  align-items: center;
  padding: var(--spacing-1);
  border: none;
  background: none;
  color: var(--color-fg-muted);
  cursor: pointer;
  transition: color 0.2s ease;
}

.icon-button:hover:not(:disabled) {
  color: var(--color-fg-primary);
}

.icon-button:disabled {
  opacity: 0.5;
  cursor: default;
}

/* Large scale for media-surface actions (video-card playlist/info
   toggles): a 1.75rem hit box with the standard 1rem icon. */
.icon-button--lg {
  padding: var(--spacing-1-5);
}

/* Compact scale for row-action buttons (list items, toasts, menu rows). */
.icon-button--sm {
  padding: var(--spacing-0-5);
}

.icon-button--sm .icon-button__icon,
.icon-button--sm .icon-button__icon :deep(svg) {
  width: 0.75rem;
  height: 0.75rem;
}

.icon-button--active,
.icon-button--active:hover:not(:disabled) {
  color: var(--color-accent-primary);
}

.icon-button--danger:hover:not(:disabled) {
  color: var(--color-status-error);
}

.icon-button--armed,
.icon-button--armed:hover:not(:disabled) {
  color: var(--color-status-error);
  background-color: color-mix(
    in srgb,
    var(--color-status-error) 20%,
    transparent
  );
  animation: pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Attention cue: pulsing accent ring. Works while disabled too — a disabled
   button still receives hover/focus events, and the ring is what draws the
   eye to the reason it is disabled. */
.icon-button--blinking {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  box-shadow: 0 0 0 2px var(--color-accent-primary);
}

/* Defined here (scoped, auto-renamed by Vue) so the pulse animations never
   depend on a global keyframes definition being present. */
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.icon-button__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
}

.icon-button__icon :deep(svg) {
  width: 1rem;
  height: 1rem;
}
</style>
