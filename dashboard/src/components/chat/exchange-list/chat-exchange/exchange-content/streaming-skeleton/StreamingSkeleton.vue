<script setup lang="ts">
/**
 * Three pulsing dots shown while an assistant response streams before its
 * first harness data arrives.
 */
</script>

<template>
  <span class="streaming-skeleton">
    <span class="streaming-skeleton__dot" />
    <span class="streaming-skeleton__dot" style="animation-delay: 0.2s" />
    <span class="streaming-skeleton__dot" style="animation-delay: 0.4s" />
  </span>
</template>

<style scoped>
.streaming-skeleton {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  color: var(--color-fg-muted);
}

.streaming-skeleton__dot {
  width: 0.375rem;
  height: 0.375rem;
  background-color: var(--color-tab-rest);
  /* keyframes pulse: global, from the Tailwind theme */
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
