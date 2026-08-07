<script setup lang="ts">
import Tooltip from '../../../../../shared/ui/tooltip/Tooltip.vue';

defineProps<{
  title: string;
  active?: boolean;
  disabled?: boolean;
  blinking?: { value: boolean };
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}>();

defineEmits<{
  click: [event: MouseEvent];
}>();
</script>

<template>
  <Tooltip :text="title" :disabled="disabled">
    <button
      class="toolbar-icon-button"
      :class="{
        'toolbar-icon-button--active': active,
        'toolbar-icon-button--disabled': disabled,
        'toolbar-icon-button--blinking': blinking?.value,
      }"
      :disabled="disabled"
      :aria-label="title"
      @mouseenter="disabled && onMouseEnter?.()"
      @mouseleave="disabled && onMouseLeave?.()"
      @click.stop="$emit('click', $event)"
    >
      <slot />
    </button>
  </Tooltip>
</template>

<style scoped>
.toolbar-icon-button {
  padding: var(--spacing-1-5);
  color: var(--color-fg-muted);
  flex-shrink: 0;
  cursor: pointer;
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.toolbar-icon-button:hover:not(.toolbar-icon-button--disabled) {
  color: var(--color-accent-primary);
}

.toolbar-icon-button--active {
  color: var(--color-accent-primary);
}

.toolbar-icon-button--disabled {
  opacity: 0.4;
  cursor: default;
}

.toolbar-icon-button--blinking {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  box-shadow: 0 0 0 2px var(--color-accent-primary);
}
</style>
