<script setup lang="ts">
/**
 * The prompt bar's floating icon-menu strip, straddling the bar's top border
 * on the right. Pure positioning shell — the orchestrator decides what the
 * strip holds and its visibility.
 */
</script>

<template>
  <div class="source-tags-strip">
    <slot />
  </div>
</template>

<style scoped>
/* Search-source icons floating on the prompt area's top border, aligned
   right; the bar background punches the border line out behind them. The
   z-index + pointer-events keep the strip clickable — without them the
   overlapping exchange content swallows the clicks before the buttons. */
.source-tags-strip {
  position: absolute;
  top: 0;
  right: 1.1rem;
  z-index: 10;
  pointer-events: auto;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 1.2rem;
  padding: 0 var(--spacing-1);
}
</style>
