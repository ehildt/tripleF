<script setup lang="ts">
import { motion } from 'motion-v';

/**
 * Wraps an icon (any Lucide / SVG component passed through the default slot)
 * in a subtle hover/press micro-interaction via Motion. The parent keeps full
 * control of the icon's size/class through the slot. Meant for interactive
 * controls only — decorative icons should stay plain. Motion respects
 * `prefers-reduced-motion`, so the animation is skipped for users who opt out.
 */
</script>

<template>
  <motion.span
    class="motion-icon"
    :while-hover="{ scale: 1.15 }"
    :while-press="{ scale: 0.9 }"
    :transition="{ type: 'spring', stiffness: 500, damping: 22 }"
  >
    <slot />
  </motion.span>
</template>

<style scoped>
.motion-icon {
  display: inline-flex;
}
</style>
