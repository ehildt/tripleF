<script setup lang="ts">
/**
 * Layout row for a chart: a padded, bordered box that fills the full width
 * of the response. The chart content goes in the default slot.
 */
</script>

<template>
  <div class="chart-row">
    <slot />
  </div>
</template>

<style scoped>
.chart-row {
  padding: 1rem;
  border: 1px solid var(--color-divider);
}
</style>
