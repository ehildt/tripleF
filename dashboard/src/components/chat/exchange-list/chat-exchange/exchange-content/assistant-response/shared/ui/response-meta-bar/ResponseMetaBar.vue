<script setup lang="ts">
/**
 * Dumb flex wrapper for a single-row metadata strip.
 * Contents are provided by the consumer via <slot/>.
 */
</script>

<template>
  <div class="meta-bar"><slot /></div>
</template>

<style scoped>
.meta-bar {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: var(--spacing-1-5);
}
</style>
