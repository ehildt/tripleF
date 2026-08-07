<script setup lang="ts">
import { RotateCcw } from '@lucide/vue';

import Tooltip from '../tooltip/Tooltip.vue';

/** Panel-header reset icon button, next to the power toggle. */
withDefaults(
  defineProps<{
    title?: string;
    disabled?: boolean;
  }>(),
  { title: 'Reset to defaults' },
);

const emit = defineEmits<{
  click: [];
}>();
</script>

<template>
  <Tooltip :text="title" :disabled="disabled">
    <button
      type="button"
      class="reset-button"
      :disabled="disabled"
      :aria-label="title"
      @click="emit('click')"
    >
      <RotateCcw class="reset-button__icon" />
    </button>
  </Tooltip>
</template>

<style scoped>
.reset-button {
  display: grid;
  place-items: center;
  width: 1.5rem;
  height: 1.5rem;
  border: none;
  background: none;
  color: var(--color-fg-muted);
  cursor: pointer;
  transition: color 0.2s ease;
}

.reset-button:hover:not(:disabled) {
  color: var(--color-fg-primary);
}

.reset-button:disabled {
  opacity: 0.4;
  cursor: default;
}

.reset-button__icon {
  width: 0.875rem;
  height: 0.875rem;
}
</style>
