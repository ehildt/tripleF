<script setup lang="ts">
import type { MediaCaptionScrimProps } from './MediaCaptionScrim.types';

withDefaults(defineProps<MediaCaptionScrimProps>(), {
  as: 'div',
  edge: 'bottom',
});
</script>

<template>
  <component
    :is="as"
    class="media-caption-scrim"
    :class="{ 'media-caption-scrim--top': edge === 'top' }"
  >
    <slot />
  </component>
</template>

<style scoped>
.media-caption-scrim {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  /* Overlays the media regardless of DOM order (e.g. consumers that place
     it before a positioned video figure). */
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  /* Extra top padding gives the fade its runway above the text. */
  padding: var(--spacing-3) var(--spacing-2) var(--spacing-1-5);
  /* Scrim: near-solid through the text band, then an ease-shaped fade to
     transparent so the caption has no hard top edge. */
  background: linear-gradient(
    to top,
    color-mix(in srgb, var(--color-bg-primary) 92%, transparent) 0%,
    color-mix(in srgb, var(--color-bg-primary) 90%, transparent) 30%,
    color-mix(in srgb, var(--color-bg-primary) 80%, transparent) 45%,
    color-mix(in srgb, var(--color-bg-primary) 60%, transparent) 60%,
    color-mix(in srgb, var(--color-bg-primary) 36%, transparent) 75%,
    color-mix(in srgb, var(--color-bg-primary) 14%, transparent) 88%,
    transparent 100%
  );
}

/* Top edge: anchored to the media's top with the gradient mirrored — solid
   at the top, fading downward, runway padding below the text. */
.media-caption-scrim--top {
  top: 0;
  bottom: auto;
  padding: var(--spacing-1-5) var(--spacing-2) var(--spacing-3);
  background: linear-gradient(
    to bottom,
    color-mix(in srgb, var(--color-bg-primary) 92%, transparent) 0%,
    color-mix(in srgb, var(--color-bg-primary) 90%, transparent) 30%,
    color-mix(in srgb, var(--color-bg-primary) 80%, transparent) 45%,
    color-mix(in srgb, var(--color-bg-primary) 60%, transparent) 60%,
    color-mix(in srgb, var(--color-bg-primary) 36%, transparent) 75%,
    color-mix(in srgb, var(--color-bg-primary) 14%, transparent) 88%,
    transparent 100%
  );
}
</style>
