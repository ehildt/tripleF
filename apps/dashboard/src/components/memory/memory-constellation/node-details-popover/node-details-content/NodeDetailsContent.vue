<script setup lang="ts">
import { Download } from '@lucide/vue';

import type { NodeDetailsContentProps } from './NodeDetailsContent.types';

defineProps<NodeDetailsContentProps>();
</script>

<template>
  <div class="node-details-content">
    <a
      v-if="downloadUrl"
      class="node-details-content__download"
      :href="downloadUrl"
      download
    >
      <Download />
      {{ $t('common.memoryDownloadDocument') }}
    </a>
    <!-- eslint-disable vue/no-v-html -- sanitized Markdown from the owner composable -->
    <div class="node-details-content__text" v-html="contentHtml" />
    <!-- eslint-enable vue/no-v-html -->
  </div>
</template>

<style scoped>
.node-details-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-3);
}

.node-details-content__text {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  line-height: 1.5;
  color: var(--color-fg-primary);
  overflow-wrap: anywhere;
}

.node-details-content__text :deep(> *) {
  margin-top: 0;
  margin-bottom: 0;
}

.node-details-content__text :deep(> * + *) {
  margin-top: var(--spacing-2);
}

.node-details-content__text :deep(a) {
  color: var(--color-accent-primary);
  transition: color 0.2s ease;
}

.node-details-content__download {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: var(--spacing-1);
  padding: var(--spacing-1) var(--spacing-2);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-accent-primary);
  text-decoration: none;
  border: 1px solid var(--color-divider);
  background-color: var(--color-bg-secondary);
}

.node-details-content__download:hover {
  border-color: var(--color-accent-primary);
}

.node-details-content__download svg {
  width: 0.875rem;
  height: 0.875rem;
}
</style>
