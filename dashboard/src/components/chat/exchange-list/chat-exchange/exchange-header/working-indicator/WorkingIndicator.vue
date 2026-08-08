<script setup lang="ts">
/**
 * Thin presentational wrapper for the animated "working" loader. The full
 * animated SVG lives in `src/assets/icons/working-indicator.svg` (SMIL shape
 * morphing + dot-count changes, theme-token colors, reduced-motion fallback).
 * It is inlined (not an `<img>`) so the SVG's CSS variables resolve against
 * the active palette and its SMIL animations run in the document.
 */
import workingIndicatorSvg from '@/assets/icons/working-indicator.svg?raw';
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -- inlines the static project SVG -->
  <div class="working-indicator" v-html="workingIndicatorSvg"></div>
</template>

<style scoped>
.working-indicator {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  line-height: 0;
}
</style>
