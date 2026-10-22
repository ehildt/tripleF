<script setup lang="ts">
/**
 * The populated half of the metadata column: the selected dot's label, full
 * text (rendered through markdown-it — encyclopedia chunks arrive as
 * crawled markdown), an optional download of the stored original document,
 * the contested frictions, the evidence list, and the deduplicated meta
 * rows as tag chips. Renders only when a dot is selected — the column
 * handles the empty state.
 */
import { Download } from '@lucide/vue';
import { computed } from 'vue';

import { renderMarkdown } from '@/utils/render-markdown.helper';
import { repairSpacedLinks } from '@/utils/repair-spaced-links.helper';

import type { NodeMetadataContentProps } from './NodeMetadataContent.types';

const props = defineProps<NodeMetadataContentProps>();

// Crawled markdown arrives with urls split by sentence chunking
// (`https://en. wikipedia. org/…`) — repair destinations before rendering.
const textHtml = computed(() =>
  props.node.text ? renderMarkdown(repairSpacedLinks(props.node.text)) : '',
);
</script>

<template>
  <h3 class="node-metadata-content__label">{{ node.label }}</h3>
  <!-- eslint-disable vue/no-v-html -- markdown-it render, DOMPurify-sanitized -->
  <div class="node-metadata-content__text" v-html="textHtml" />
  <!-- eslint-enable vue/no-v-html -->
  <a
    v-if="node.downloadUrl"
    class="node-metadata-content__download"
    :href="node.downloadUrl"
    download
  >
    <Download />
    {{ $t('common.memoryDownloadDocument') }}
  </a>
  <div v-if="frictions?.length" class="node-metadata-content__frictions">
    <span class="node-metadata-content__frictions-tag">{{
      $t('common.memoryFrictionTag')
    }}</span>
    <p
      v-for="(friction, index) in frictions"
      :key="`${friction.source}|${friction.target}|${index}`"
      class="node-metadata-content__friction"
    >
      {{ friction.reason }}
    </p>
  </div>
  <div
    v-if="node.evidenceTexts?.length"
    class="node-metadata-content__evidence"
  >
    <span class="node-metadata-content__evidence-tag">{{
      $t('common.memoryEvidenceTag')
    }}</span>
    <p
      v-for="(text, index) in node.evidenceTexts"
      :key="index"
      class="node-metadata-content__evidence-item"
    >
      {{ text }}
    </p>
  </div>
  <div v-if="tags?.length" class="node-metadata-content__tags">
    <span
      v-for="tag in tags"
      :key="`${tag.label}:${tag.value}`"
      class="node-metadata-content__tag"
    >
      <span class="node-metadata-content__tag-key">{{ tag.label }}</span>
      {{ tag.value }}
    </span>
  </div>
</template>

<style scoped>
.node-metadata-content__label {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-fg-secondary);
  overflow-wrap: anywhere;
}

.node-metadata-content__text {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  line-height: 1.5;
  color: var(--color-fg-primary);
  /* Long unbroken tokens (auto-linked urls) wrap instead of overflowing. */
  overflow-wrap: anywhere;
  /* Long documents stay readable: the text scrolls inside its own bounded
     box instead of pushing the actions/meta rows out of view. */
  max-height: 20rem;
  overflow-y: auto;
  padding-right: var(--spacing-1);
}

.node-metadata-content__text :deep(> *) {
  margin-top: 0;
  margin-bottom: 0;
}

.node-metadata-content__text :deep(> * + *) {
  margin-top: var(--spacing-2);
}

.node-metadata-content__text :deep(a) {
  color: var(--color-accent-primary);
  transition: color 0.2s ease;
}

.node-metadata-content__download {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-1);
  align-self: flex-start;
  padding: var(--spacing-1) var(--spacing-2);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-accent-primary);
  text-decoration: none;
  border: 1px solid var(--color-divider);
  background-color: var(--color-bg-secondary);
}

.node-metadata-content__download:hover {
  border-color: var(--color-accent-primary);
}

.node-metadata-content__download svg {
  width: 0.875rem;
  height: 0.875rem;
}

.node-metadata-content__tags {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--spacing-1);
  padding-top: var(--spacing-2);
  border-top: 1px solid var(--color-divider);
}

.node-metadata-content__tag {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-0-5);
  min-width: 0;
  padding: var(--spacing-1) var(--spacing-1-5);
  overflow-wrap: anywhere;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-fg-primary);
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-divider);
}

.node-metadata-content__tag-key {
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-fg-muted);
}

/* Contested section: an open friction the selected dot is party to. */
.node-metadata-content__frictions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  padding: var(--spacing-2);
  background-color: color-mix(
    in srgb,
    var(--color-status-warning) 12%,
    transparent
  );
  border: 1px solid
    color-mix(in srgb, var(--color-status-warning) 45%, transparent);
}

.node-metadata-content__frictions-tag {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-status-warning);
}

.node-metadata-content__friction {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  line-height: 1.4;
  color: var(--color-fg-primary);
  overflow-wrap: anywhere;
}

/* Evidence section: the supporting facts a bridge/conviction cites. */
.node-metadata-content__evidence {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  padding: var(--spacing-2);
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-divider);
}

.node-metadata-content__evidence-tag {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-fg-muted);
}

.node-metadata-content__evidence-item {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  line-height: 1.4;
  color: var(--color-fg-primary);
  overflow-wrap: anywhere;
}
</style>
