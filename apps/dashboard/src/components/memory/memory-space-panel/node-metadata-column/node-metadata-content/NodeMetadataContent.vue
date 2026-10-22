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

import { repairSpacedLinks } from '@/components/memory/memory-space-panel/node-metadata-column/node-metadata-content/helpers/repair-spaced-links.helper';
import { renderMarkdown } from '@/utils/render-markdown/render-markdown.helper';

import NodeMetadataSection from './node-metadata-section/NodeMetadataSection.vue';
import type { NodeMetadataContentProps } from './NodeMetadataContent.types';

const props = defineProps<NodeMetadataContentProps>();

// Crawled markdown arrives with urls split by sentence chunking
// (`https://en. wikipedia. org/…`) — repair destinations before rendering.
const textHtml = computed(() =>
  props.node.text ? renderMarkdown(repairSpacedLinks(props.node.text)) : '',
);

/** The selected dot's friction reasons as plain rows for the warning section. */
const frictionReasons = computed(() =>
  (props.frictions ?? []).map((friction) => friction.reason ?? ''),
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
  <NodeMetadataSection
    v-if="frictions?.length"
    :label="$t('common.memoryFrictionTag')"
    :items="frictionReasons"
    tone="warning"
  />
  <NodeMetadataSection
    v-if="node.evidenceTexts?.length"
    :label="$t('common.memoryEvidenceTag')"
    :items="node.evidenceTexts"
    tone="neutral"
  />
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
</style>
