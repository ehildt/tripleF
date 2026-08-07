<script setup lang="ts">
import MotionIcon from '../motion-icon/MotionIcon.vue';
import Tooltip from '../tooltip/Tooltip.vue';

defineProps<{
  title?: string;
  ariaLabel?: string;
  active?: boolean;
  disabled?: boolean;
  danger?: boolean;
  armed?: boolean;
}>();

const emit = defineEmits<{
  (e: 'click'): void;
}>();
</script>

<template>
  <Tooltip :text="title ?? ''" :disabled="disabled">
    <button
      class="icon-button"
      :class="{
        'icon-button--active': active,
        'icon-button--danger': danger,
        'icon-button--armed': armed,
      }"
      :aria-label="ariaLabel ?? title"
      :disabled="disabled"
      @click="emit('click')"
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
