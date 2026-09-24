<script setup lang="ts">
import { computed, toRef } from 'vue';

import { renderMarkdown } from '@/utils/render-markdown.helper';

import { useReasoningAutoscroll } from './composables/use-reasoning-autoscroll';

const props = defineProps<{
  reasoning?: string;
}>();

const { setReasoningElement, handleScroll } = useReasoningAutoscroll(
  toRef(props, 'reasoning'),
);

const reasoningHtml = computed(() => renderMarkdown(props.reasoning ?? ''));
</script>

<template>
  <div class="exchange-activity" data-exchange-activity>
    <!-- eslint-disable vue/no-v-html -- HTML is rendered by markdown-it and sanitized by DOMPurify -->
    <div
      :ref="setReasoningElement"
      class="exchange-activity__reasoning"
      @scroll.passive="handleScroll"
      v-html="reasoningHtml"
    />
    <!-- eslint-enable vue/no-v-html -->
  </div>
</template>

<style scoped>
.exchange-activity {
  display: flex;
  align-items: flex-start;
  width: 100%;
  min-width: 0;
  padding: 0.5rem;
}

.exchange-activity__reasoning {
  width: 100%;
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: var(--color-fg-muted);
  max-height: 12rem;
  overflow-y: auto;
  /* Long unbroken tokens (URLs, JSON fragments) must wrap instead of
     opening a horizontal scrollbar. overflow-wrap is inherited, so the
     markdown children wrap as well. */
  overflow-x: hidden;
  overflow-wrap: anywhere;
  min-width: 0;
  scrollbar-width: thin;
  scrollbar-color: var(--color-accent-primary) var(--color-bg-secondary);
}

.exchange-activity__reasoning::-webkit-scrollbar {
  width: 8px;
}

.exchange-activity__reasoning::-webkit-scrollbar-track {
  background: var(--color-bg-secondary);
}

.exchange-activity__reasoning::-webkit-scrollbar-thumb {
  background: var(--color-accent-primary);
}

.exchange-activity__reasoning::-webkit-scrollbar-thumb:hover {
  background: var(--color-accent-secondary);
}

.exchange-activity__reasoning :deep(p) {
  margin: 0 0 0.5em;
}

.exchange-activity__reasoning :deep(p:last-child) {
  margin-bottom: 0;
}

.exchange-activity__reasoning :deep(h1),
.exchange-activity__reasoning :deep(h2),
.exchange-activity__reasoning :deep(h3),
.exchange-activity__reasoning :deep(h4),
.exchange-activity__reasoning :deep(h5),
.exchange-activity__reasoning :deep(h6) {
  margin: 0.5em 0 0.25em;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-fg-secondary);
}

.exchange-activity__reasoning :deep(ul),
.exchange-activity__reasoning :deep(ol) {
  margin: 0 0 0.5em;
  padding: var(--spacing-2);
  padding-left: var(--spacing-4);
}

.exchange-activity__reasoning :deep(code) {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  padding: 0 var(--spacing-0-5);
  background-color: var(--color-bg-tertiary);
  color: var(--color-fg-secondary);
}

.exchange-activity__reasoning :deep(pre) {
  margin: 0 0 0.5em;
  padding: var(--spacing-1) var(--spacing-2);
  background-color: var(--color-bg-tertiary);
  /* Thinking traces are prose, not source code: wrap preformatted blocks
     too so the reasoning area never grows a horizontal scrollbar. */
  white-space: pre-wrap;
  overflow-x: hidden;
}

.exchange-activity__reasoning :deep(pre code) {
  padding: 0;
  background: none;
}

.exchange-activity__reasoning :deep(blockquote) {
  margin: 0 0 0.5em;
  padding: var(--spacing-2);
  border-left: 2px solid
    color-mix(in srgb, var(--color-accent-primary) 40%, transparent);
}

/* Markdown block elements without dedicated rules (divs, tables) plus the
   element following a heading get the same breathing room as the prose
   blocks above. */
.exchange-activity__reasoning :deep(div),
.exchange-activity__reasoning :deep(table) {
  padding: var(--spacing-2);
}

.exchange-activity__reasoning :deep(h1 + *),
.exchange-activity__reasoning :deep(h2 + *),
.exchange-activity__reasoning :deep(h3 + *),
.exchange-activity__reasoning :deep(h4 + *),
.exchange-activity__reasoning :deep(h5 + *),
.exchange-activity__reasoning :deep(h6 + *) {
  padding: var(--spacing-2);
}

.exchange-activity__reasoning :deep(a) {
  color: var(--color-accent-primary);
}

.exchange-activity__reasoning :deep(strong) {
  color: var(--color-fg-secondary);
}
</style>
