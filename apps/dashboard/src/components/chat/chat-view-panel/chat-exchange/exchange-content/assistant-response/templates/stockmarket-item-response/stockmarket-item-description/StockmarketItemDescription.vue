<script setup lang="ts">
/**
 * Short description paragraph of a single-instrument stock card.
 * Presentational.
 */
defineProps<{
  text: string;
}>();
</script>

<template>
  <p class="stockmarket-item-description">{{ text }}</p>
</template>

<style scoped>
.stockmarket-item-description {
  margin: 0;
  color: var(--color-fg-primary);
}
</style>
