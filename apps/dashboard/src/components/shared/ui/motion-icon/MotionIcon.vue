<script setup lang="ts">
/**
 * Wraps an icon (any Lucide / SVG component passed through the default slot)
 * in a subtle hover/press micro-interaction via plain CSS. The parent keeps
 * full control of the icon's size/class through the slot. Meant for
 * interactive controls only — decorative icons should stay plain. The
 * spring-like cubic-bezier reproduces the previous motion-v spring, and the
 * transition is disabled for users who opt out of motion.
 */
</script>

<template>
  <span class="motion-icon">
    <slot />
  </span>
</template>

<style scoped>
.motion-icon {
  display: inline-flex;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.motion-icon:hover {
  transform: scale(1.15);
}

.motion-icon:active {
  transform: scale(0.9);
}

@media (prefers-reduced-motion: reduce) {
  .motion-icon {
    transition: none;
  }
}
</style>
