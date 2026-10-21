<script setup lang="ts">
/**
 * Animated loading bar shown while DLQ requests are pending. The `default`
 * variant pulses in the loading (warning) color, `aborting` switches to the
 * secondary loading color. The slide animation is the global `battery-slide`
 * keyframes declared in `assets/css/style.css`.
 */
import type { DlqPendingIndicatorProps } from './DlqPendingIndicator.types';

withDefaults(defineProps<DlqPendingIndicatorProps>(), {
  variant: 'default',
});
</script>

<template>
  <span class="dlq-pending-indicator">
    <span
      class="dlq-pending-indicator__bar"
      :class="{
        'dlq-pending-indicator__bar--aborting': variant === 'aborting',
      }"
    />
  </span>
</template>

<style scoped>
.dlq-pending-indicator {
  position: relative;
  display: inline-block;
  width: 2rem;
  height: 0.375rem;
  overflow: hidden;
  background-color: var(--color-bg-tertiary);
}

.dlq-pending-indicator__bar {
  position: absolute;
  top: 0;
  left: 0;
  width: 50%;
  height: 100%;
  background-color: var(--color-loading);
  animation: battery-slide 1.5s ease-in-out infinite;
}

.dlq-pending-indicator__bar--aborting {
  background-color: var(--color-loading-secondary);
}
</style>
