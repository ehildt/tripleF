<script setup lang="ts">
import { Eye, EyeOff } from '@lucide/vue';

import MotionIcon from '../motion-icon/MotionIcon.vue';

/**
 * Panel-header preview icon button, next to the reset button. When `active`,
 * the preview it toggles is currently shown — the icon flips to a closed eye
 * so the button reads as "hide the preview".
 */
withDefaults(
  defineProps<{
    title?: string;
    disabled?: boolean;
    active?: boolean;
  }>(),
  { title: 'Show an example', active: false },
);

const emit = defineEmits<{
  click: [];
}>();
</script>

<template>
  <button
    type="button"
    class="preview-button"
    :class="{ 'preview-button--active': active }"
    :disabled="disabled"
    :title="title"
    :aria-label="title"
    :aria-pressed="active"
    @click="emit('click')"
  >
    <MotionIcon>
      <EyeOff v-if="active" class="preview-button__icon" />
      <Eye v-else class="preview-button__icon" />
    </MotionIcon>
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

.preview-button--active {
  color: var(--color-accent-primary);
}

.preview-button--active:hover:not(:disabled) {
  color: var(--color-accent-primary);
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
