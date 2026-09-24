<script setup lang="ts">
import type { LeftToolbarLabelProps } from './LeftToolbarLabel.types';

withDefaults(defineProps<LeftToolbarLabelProps>(), {
  active: false,
});
</script>

<template>
  <span
    class="left-toolbar-label"
    :class="{ 'left-toolbar-label--active': active }"
    >{{ value }}</span
  >
</template>

<style scoped>
.left-toolbar-label {
  font-size: 0.75rem;
  font-family: var(--font-mono);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  color: var(--color-fg-secondary);
}

.left-toolbar-label--active {
  color: var(--color-accent-primary);
}
</style>
