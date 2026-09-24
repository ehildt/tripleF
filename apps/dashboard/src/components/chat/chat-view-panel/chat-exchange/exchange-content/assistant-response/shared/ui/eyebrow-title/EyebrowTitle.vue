<script setup lang="ts">
/**
 * Small-caps section eyebrow above product blocks (where-to-buy, key specs,
 * pros/cons): mono, uppercase, letter-spaced, muted. `tone` tints the text
 * for semantic lists (pros/cons); `ruled` adds a bottom hairline.
 */
import type { EyebrowTitleProps } from './EyebrowTitle.types';

defineProps<EyebrowTitleProps>();
</script>

<template>
  <h3
    class="eyebrow-title"
    :class="{
      'eyebrow-title--success': tone === 'success',
      'eyebrow-title--error': tone === 'error',
      'eyebrow-title--ruled': ruled,
    }"
  >
    {{ title }}
  </h3>
</template>

<style scoped>
.eyebrow-title {
  margin: 0;
  font-size: 0.7rem;
  font-family: var(--font-mono);
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-fg-muted);
}

.eyebrow-title--success {
  color: var(--color-status-success);
}

.eyebrow-title--error {
  color: var(--color-status-error);
}

.eyebrow-title--ruled {
  padding-bottom: var(--spacing-1-5);
  border-bottom: 1px solid var(--color-divider);
}
</style>
