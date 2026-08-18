<script setup lang="ts">
/**
 * The shared hero text stack used by the split-hero direction of the
 * snippet-composed templates (news, article, evaluation): the title block
 * and the lead sit in a stacked column beside the hero media panel.
 *
 * The look is fixed — a quiet panel on the tertiary background with no
 * visible border and no divider rule — so every template renders the
 * same hero stack.
 */
</script>

<template>
  <div class="hero-stack">
    <slot />
  </div>
</template>

<style scoped>
.hero-stack {
  display: flex;
  flex-direction: column;
  gap: 0.75em;
  min-width: 0;
  /* Split hero: keep the media panel top-aligned while the title stack
     centers vertically beside it. */
  align-self: center;
  background-color: var(--color-bg-tertiary);
  padding: var(--spacing-3);
}
</style>
