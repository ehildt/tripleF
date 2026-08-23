<script setup lang="ts">
/**
 * Seamless, endlessly-scrolling marquee text. Renders the text twice (the
 * second copy is aria-hidden) so the -50% translate wrap is invisible, with
 * a decorative bullet between copies. Owns the overflow clipping, the
 * scroll animation, and the `prefers-reduced-motion` opt-out. Typography and
 * layout sizing are left to the parent via a class on the root (inherited by
 * the text spans), so each surface keeps its own size/color.
 */
withDefaults(
  defineProps<{
    /** Text to scroll. */
    text?: string;
  }>(),
  { text: '' },
);
</script>

<template>
  <span class="marquee">
    <span class="marquee__track">
      <span class="marquee__text">{{ text }}</span>
      <span class="marquee__separator" aria-hidden="true">•</span>
      <span class="marquee__text" aria-hidden="true">{{ text }}</span>
      <span class="marquee__separator" aria-hidden="true">•</span>
    </span>
  </span>
</template>

<style scoped>
.marquee {
  display: flex;
  align-items: center;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
}

.marquee__track {
  display: inline-flex;
  white-space: nowrap;
  animation: marquee-scroll 12s linear infinite;
}

.marquee__text {
  padding-right: var(--spacing-1-5);
}

.marquee__separator {
  padding-right: var(--spacing-1-5);
}

@keyframes marquee-scroll {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .marquee__track {
    animation: none;
  }
}
</style>
