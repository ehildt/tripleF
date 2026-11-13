<script setup lang="ts">
import { useTextResponse } from './composables/use-text-response';
import type { TextResponseProps } from './TextResponse.types';

const props = defineProps<TextResponseProps>();

const { renderedHtml } = useTextResponse(props);
</script>

<template>
  <div v-if="renderedHtml" class="text-response">
    <!-- eslint-disable vue/no-v-html -- HTML is rendered by markdown-it and sanitized by DOMPurify -->
    <section class="response-text" v-html="renderedHtml" />
    <!-- eslint-enable vue/no-v-html -->
  </div>
</template>

<style scoped>
.text-response {
  width: 100%;
  padding: var(--spacing-2) var(--spacing-3);
  line-height: 1.7;
}

.response-text {
  color: var(--color-fg-secondary);
  font-family: var(--font-sans);
  overflow-wrap: anywhere;
}

/* v-html-injected markdown needs :deep because its children do not carry
   this component's scope id. Direct siblings share one vertical rhythm;
   nested paragraphs keep their own smaller blockquote/list spacing. */
.response-text :deep(p) {
  margin: 0;
}

.response-text :deep(> * + *) {
  margin-top: var(--spacing-3);
}

.response-text :deep(strong) {
  color: var(--color-fg-primary);
  font-weight: 700;
}

/* ---------- lists ---------- */

.response-text :deep(ul),
.response-text :deep(ol) {
  margin: 0;
  padding-left: var(--spacing-6);
}

.response-text :deep(ul) {
  list-style-type: '- ';
}

/* Space before the list container itself, unless it leads the response. */
.response-text :deep(ul:not(:first-child)),
.response-text :deep(ol:not(:first-child)) {
  margin-top: var(--spacing-3);
}

/* Keep following prose and other blocks separated from the list container. */
.response-text :deep(> ul + *),
.response-text :deep(> ol + *) {
  margin-top: var(--spacing-3);
}

.response-text :deep(li + li) {
  margin-top: var(--spacing-1);
}

.response-text :deep(li::marker) {
  color: var(--color-accent-primary);
}

/* ---------- block elements ---------- */

.response-text :deep(pre),
.response-text :deep(table),
.response-text :deep(blockquote) {
  margin: 0;
}

.response-text :deep(blockquote > p + p) {
  margin-top: var(--spacing-2);
}

/* ---------- headings ---------- */

.response-text :deep(h1),
.response-text :deep(h2),
.response-text :deep(h3),
.response-text :deep(h4),
.response-text :deep(h5),
.response-text :deep(h6) {
  margin: 0;
  color: var(--color-fg-primary);
  font-family: var(--font-sans);
  line-height: 1.35;
}

/* A leading heading stays flush; headings following content get extra
   separation from the preceding block. */
.response-text :deep(> * + h1),
.response-text :deep(> * + h2),
.response-text :deep(> * + h3),
.response-text :deep(> * + h4),
.response-text :deep(> * + h5),
.response-text :deep(> * + h6) {
  margin-top: var(--spacing-4);
}

.response-text :deep(h1),
.response-text :deep(h2) {
  font-size: 1.25rem;
  font-weight: 700;
}

.response-text :deep(h3),
.response-text :deep(h4) {
  font-size: 1.125rem;
  font-weight: 700;
}

.response-text :deep(h5),
.response-text :deep(h6) {
  font-size: 1rem;
  font-weight: 600;
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
  color: var(--color-accent-primary);
  text-decoration: underline;
  text-underline-offset: 0.15em;
  transition: color 0.2s ease;
}

.response-text :deep(a:hover) {
  color: var(--color-accent-hover);
}

.response-text :deep(blockquote) {
  quotes: '“' '”';
  padding: var(--spacing-2) var(--spacing-3);
  border-left: 0.1875rem solid var(--color-accent-primary);
  background-color: color-mix(
    in srgb,
    var(--color-accent-primary) 5%,
    transparent
  );
  color: var(--color-fg-primary);
  font-style: italic;
}

/* Decorative outer quotes: one pair around the whole blockquote, including
   multi-paragraph quotes. The semantic element already announces a quote. */
.response-text :deep(blockquote > p:first-of-type::before) {
  content: open-quote;
  color: var(--color-accent-primary);
  font-style: normal;
  font-weight: 700;
}

.response-text :deep(blockquote > p:last-of-type::after) {
  content: close-quote;
  color: var(--color-accent-primary);
  font-style: normal;
  font-weight: 700;
}

.response-text :deep(pre) {
  padding: var(--spacing-2) var(--spacing-3);
  overflow-x: auto;
  background-color: var(--color-bg-tertiary);
  border-left: 0.1875rem solid
    color-mix(in srgb, var(--color-accent-primary) 40%, transparent);
}

.response-text :deep(code) {
  padding: 0.1em 0.3em;
  border-radius: 0.25rem;
  background-color: color-mix(in srgb, var(--color-fg-primary) 8%, transparent);
  color: var(--color-fg-primary);
  font-size: 0.9em;
}

.response-text :deep(pre code) {
  padding: 0;
  background: none;
  color: inherit;
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

.response-text :deep(table) {
  width: 100%;
  border-collapse: collapse;
}

.response-text :deep(th),
.response-text :deep(td) {
  padding: var(--spacing-2);
  border-bottom: 0.0625rem solid var(--color-divider);
  text-align: left;
  vertical-align: top;
}

.response-text :deep(th) {
  background-color: color-mix(in srgb, var(--color-fg-primary) 4%, transparent);
  color: var(--color-fg-primary);
  font-weight: 600;
}

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
