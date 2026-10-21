<script setup lang="ts">
/**
 * Shared actions bar for settings and tools panels: an end-aligned row of
 * action buttons over the radiant accent gradient (primary from the left,
 * secondary from the right, elevated base). Content arrives via the default
 * slot; the bar is a pure layout region and owns no behavior.
 */
</script>

<template>
  <div class="panel-actions">
    <slot />
  </div>
</template>

<style scoped>
.panel-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: var(--spacing-1);
  min-height: calc(2.25rem + 2 * var(--spacing-2));
  padding: 0 var(--spacing-3);
  background:
    radial-gradient(
      ellipse 120% 140% at 12% 50%,
      color-mix(in srgb, var(--color-accent-primary) 18%, transparent) 0%,
      transparent 60%
    ),
    radial-gradient(
      ellipse 120% 140% at 88% 50%,
      color-mix(in srgb, var(--color-accent-secondary) 14%, transparent) 0%,
      transparent 60%
    ),
    var(--color-bg-elevated);
}
</style>
