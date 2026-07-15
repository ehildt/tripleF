<script setup lang="ts">
/**
 * Pulsing mono label that shows what the pipeline is currently doing while
 * an assistant exchange is pending ("Thinking…", grouped tool activity, or
 * the current step status).
 */
defineProps<{
  label: string;
}>();
</script>

<template>
  <span class="activity-label">{{ label }}</span>
</template>

<style scoped>
.activity-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: var(--color-accent-primary);
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
