<script setup lang="ts">
/**
 * The blinking block cursor appended to an exchange body while its content
 * is still streaming.
 */
</script>

<template>
  <span class="streaming-cursor" />
</template>

<style scoped>
.streaming-cursor {
  display: inline-block;
  width: 0.5rem;
  height: 1rem;
  background-color: var(--color-tab-rest);
  margin-left: 0.125rem;
  /* keyframes pulse: global, from the Tailwind theme */
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  vertical-align: text-bottom;
}
</style>
