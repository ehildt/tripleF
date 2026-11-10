<script setup lang="ts">
import { useTemplateRef } from 'vue';

import { renderMarkdown } from '@/utils/render-markdown/render-markdown.helper';

import { useMarqueeSpeed } from './composables/use-marquee-speed';
import type { MarqueeProps } from './Marquee.types';

/**
 * Seamless, endlessly-scrolling marquee text. Renders the text twice (the
 * second copy is aria-hidden) so the -50% translate wrap is invisible, with
 * a decorative bullet between copies. Owns the overflow clipping, the
 * constant-speed scroll animation, and the `prefers-reduced-motion` opt-out.
 * Optional inline Markdown is sanitized before rendering. Typography and
 * layout sizing are left to the parent via a class on the root (inherited by
 * the text spans), so each surface keeps its own size/color.
 */
withDefaults(defineProps<MarqueeProps>(), { text: '', markdown: false });

const trackRef = useTemplateRef<HTMLElement>('track');
useMarqueeSpeed(trackRef);
</script>

<template>
  <span class="marquee">
    <span ref="track" class="marquee__track">
      <!-- eslint-disable vue/no-v-html -- Inline Markdown is rendered by markdown-it and sanitized by DOMPurify -->
      <span
        v-if="markdown"
        class="marquee__text"
        v-html="renderMarkdown(text, { inline: true })"
      />
      <span v-if="!markdown" class="marquee__text">{{ text }}</span>
      <span class="marquee__separator" aria-hidden="true">•</span>
      <span
        v-if="markdown"
        class="marquee__text"
        aria-hidden="true"
        v-html="renderMarkdown(text, { inline: true })"
      />
      <!-- eslint-enable vue/no-v-html -->
      <span v-if="!markdown" class="marquee__text" aria-hidden="true">{{
        text
      }}</span>
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

.marquee__text :deep(strong) {
  color: var(--color-accent-primary);
  font-weight: 700;
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
