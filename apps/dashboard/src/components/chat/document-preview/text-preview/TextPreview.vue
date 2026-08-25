<script setup lang="ts">
import { computed } from 'vue';

import { renderMarkdown } from '@/utils/render-markdown.helper';

import type { TextPreviewProps } from './TextPreview.types';

const props = defineProps<TextPreviewProps>();

const isMarkdown = computed(() => props.name.toLowerCase().endsWith('.md'));
const renderedHtml = computed(() => {
  if (props.html) return props.html;
  if (isMarkdown.value && props.text) return renderMarkdown(props.text);
  return null;
});
</script>

<template>
  <div class="text-preview">
    <!-- eslint-disable vue/no-v-html -- html is sanitized (docx) or produced by markdown-it + DOMPurify -->
    <div v-if="renderedHtml" class="text-preview__html" v-html="renderedHtml" />
    <!-- eslint-enable vue/no-v-html -->
    <pre v-else-if="text" class="text-preview__text">{{ text }}</pre>
  </div>
</template>

<style scoped>
.text-preview {
  width: 100%;
  min-height: 0;
}

.text-preview__html {
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--color-fg-primary);
}

.text-preview__text {
  margin: 0;
  padding: var(--spacing-2);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  line-height: 1.5;
  color: var(--color-fg-secondary);
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-divider);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>
