<script setup lang="ts">
import { computed } from 'vue';

import { renderMarkdown } from '@/utils/render-markdown.helper';

import { extractHarnessText } from '../../composables/helpers/text/extract-harness-text.helper';
import type { TextResponseProps } from './TextResponse.types';

const props = defineProps<TextResponseProps>();

const renderedHtml = computed(() =>
  renderMarkdown(extractHarnessText(props.text ?? '')),
);
</script>

<template>
  <div v-if="renderedHtml" class="response-container">
    <!-- eslint-disable vue/no-v-html -- HTML is rendered by markdown-it and sanitized by DOMPurify -->
    <section class="response-text" v-html="renderedHtml" />
    <!-- eslint-enable vue/no-v-html -->
  </div>
</template>

<style scoped>
.response-container {
  line-height: 1.65;
}

/* v-html-injected paragraphs — :deep needed since markdown children are not
   scoped component elements. Small gap between paragraphs (spacing-2). */
.response-text :deep(p + p) {
  margin-top: var(--spacing-2);
}

/* ---------- markdown block elements ----------

   Scoped to this component's markdown surface only: the padding used to be
   applied globally to every block element inside .exchange-message,
   leaking into structured template components and forcing chained-selector
   overrides there. */

.response-text :deep(div),
.response-text :deep(ul),
.response-text :deep(ol),
.response-text :deep(pre),
.response-text :deep(table),
.response-text :deep(blockquote) {
  padding: var(--spacing-2);
}

.response-text :deep(h1 + *),
.response-text :deep(h2 + *),
.response-text :deep(h3 + *),
.response-text :deep(h4 + *),
.response-text :deep(h5 + *),
.response-text :deep(h6 + *) {
  padding: var(--spacing-2);
}

/* ---------- headings ---------- */

.response-text :deep(h1) {
  padding: 0.2em 0.5em;
  background-color: color-mix(
    in srgb,
    var(--color-accent-primary) 14%,
    transparent
  );
}

.response-text :deep(h2) {
  padding: 0.2em 0.5em;
  background-color: color-mix(
    in srgb,
    var(--color-accent-primary) 12%,
    transparent
  );
}

.response-text :deep(h3) {
  padding: 0.2em 0.5em;
  background-color: color-mix(
    in srgb,
    var(--color-accent-primary) 10%,
    transparent
  );
}

.response-text :deep(h4) {
  padding: 0.2em 0.5em;
  background-color: color-mix(
    in srgb,
    var(--color-accent-primary) 8%,
    transparent
  );
}

.response-text :deep(h5) {
  padding: 0.2em 0.5em;
  background-color: color-mix(
    in srgb,
    var(--color-accent-primary) 6%,
    transparent
  );
}

.response-text :deep(h6) {
  padding: 0.2em 0.5em;
  background-color: color-mix(
    in srgb,
    var(--color-accent-primary) 4%,
    transparent
  );
}

/* ---------- markdown image galleries ----------

   Markdown image lists/cards. The structured template galleries carry the
   same element shapes but live in their own components with scoped styles,
   so they are unreachable from here. */

.response-text :deep(ul:has(> li > img)),
.response-text :deep(ol:has(> li > img)) {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  padding: 0;
  margin: 0;
  list-style: none;
}

.response-text :deep(li:has(img)) {
  display: flex;
  flex-wrap: wrap;
  list-style: none;
  border: 1px solid var(--color-divider);
  overflow: hidden;
  padding: 0;
}

.response-text :deep(li:has(img) > :not(img)) {
  width: 100%;
  padding: 0.25rem 0.375rem;
}

.response-text :deep(li:has(img) h5) {
  padding: 0.5rem;
  margin: 0;
}

.response-text :deep(li:has(img) p) {
  padding: 0.5rem;
  margin: 0;
  font-size: 0.85em;
}

.response-text :deep(li:has(img) img) {
  width: 100%;
  height: 12rem;
  object-fit: cover;
  cursor: pointer;
  max-width: none;
  padding: 0;
  border: none;
  display: block;
}

.response-text :deep(div:has(> img)) {
  display: flex;
  flex-wrap: wrap;
  border: 1px solid var(--color-divider);
  overflow: hidden;
  padding: 0;
}

.response-text :deep(div:has(> img) > :not(img)) {
  width: 100%;
  padding: 0.25rem 0.375rem;
}

.response-text :deep(div:has(> img) h5) {
  padding: 0.5rem;
  margin: 0;
}

.response-text :deep(div:has(> img) p) {
  padding: 0.5rem;
  margin: 0;
  font-size: 0.85em;
}

.response-text :deep(div:has(> img) img) {
  width: 100%;
  height: 12rem;
  object-fit: cover;
  cursor: pointer;
  max-width: none;
  padding: 0;
  border: none;
  display: block;
}

/* ---------- links, blockquotes, code ---------- */

.response-text :deep(a) {
  transition: color 0.2s ease;
}

.response-text :deep(blockquote) {
  border-left-color: var(--color-accent-primary);
  background-color: color-mix(
    in srgb,
    var(--color-accent-primary) 4%,
    transparent
  );
}

.response-text :deep(pre) {
  border-left: 3px solid
    color-mix(in srgb, var(--color-accent-primary) 40%, transparent);
}

/* ---------- inline images ---------- */

.response-text :deep(img) {
  cursor: pointer;
  transition: box-shadow 0.3s ease;
}

.response-text :deep(img:hover) {
  animation: exchange-img-pulse 2s ease-in-out infinite;
}

@keyframes exchange-img-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0
      color-mix(in srgb, var(--color-accent-primary) 30%, transparent);
  }
  50% {
    box-shadow: 0 0 0 4px
      color-mix(in srgb, var(--color-accent-primary) 30%, transparent);
  }
}

/* ---------- tables, rules, media ---------- */

.response-text :deep(tbody tr:hover) {
  background-color: color-mix(in srgb, var(--color-fg-primary) 4%, transparent);
}

.response-text :deep(hr) {
  border: none;
  height: 2px;
  background-color: var(--color-bg-tertiary);
}

.response-text :deep(video) {
  max-width: 100%;
  height: auto;
  display: block;
  border: 1px solid var(--color-divider);
}

.response-text :deep(iframe) {
  max-width: 100%;
  display: block;
  border: 1px solid var(--color-divider);
}
</style>
