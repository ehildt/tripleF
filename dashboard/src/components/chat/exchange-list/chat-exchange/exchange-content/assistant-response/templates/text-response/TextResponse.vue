<script setup lang="ts">
import { computed } from 'vue';

import { renderMarkdown } from '@/utils/render-markdown.helper';

import { extractHarnessText } from '../../composables/helpers/extract-harness-text.helper';

const props = defineProps<{
  text?: string;
}>();

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
</style>
