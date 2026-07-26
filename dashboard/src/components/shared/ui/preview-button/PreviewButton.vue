<script setup lang="ts">
import { Eye } from '@lucide/vue';

/** Panel-header preview icon button, next to the reset button. */
withDefaults(
  defineProps<{
    title?: string;
    disabled?: boolean;
  }>(),
  { title: 'Show an example' },
);

const emit = defineEmits<{
  click: [];
}>();
</script>

<template>
  <button
    type="button"
    class="preview-button"
    :disabled="disabled"
    :title="title"
    :aria-label="title"
    @click="emit('click')"
  >
    <Eye class="preview-button__icon" />
  </button>
</template>

<style scoped>
.preview-button {
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

.preview-button:hover:not(:disabled) {
  color: var(--color-fg-primary);
}

.preview-button:disabled {
  opacity: 0.4;
  cursor: default;
}

.preview-button__icon {
  width: 0.875rem;
  height: 0.875rem;
}
</style>
