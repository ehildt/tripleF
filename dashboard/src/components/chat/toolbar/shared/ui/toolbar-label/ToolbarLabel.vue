<script setup lang="ts">
withDefaults(
  defineProps<{
    value: string;
    active?: boolean;
  }>(),
  {
    active: false,
  },
);
</script>

<template>
  <span class="toolbar-label" :class="{ 'toolbar-label--active': active }">{{
    value
  }}</span>
</template>

<style scoped>
.toolbar-label {
  font-size: 0.75rem;
  font-family: var(--font-mono);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  color: var(--color-fg-secondary);
}

.toolbar-label--active {
  color: var(--color-accent-primary);
}
</style>
