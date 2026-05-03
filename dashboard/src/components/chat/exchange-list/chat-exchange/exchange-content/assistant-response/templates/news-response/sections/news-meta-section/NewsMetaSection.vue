<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  dateline?: string;
  publishDate?: string;
  readTime?: string;
  byline?: string;
}>();

const metaParts = computed(() => {
  const parts: string[] = [];
  if (props.dateline) parts.push(props.dateline);
  if (props.publishDate) parts.push(`Published: ${props.publishDate}`);
  if (props.readTime) parts.push(`Read time: ${props.readTime}`);
  if (props.byline) parts.push(`By ${props.byline}`);
  return parts;
});
</script>

<template>
  <p v-if="metaParts.length" class="news-meta-section">
    {{ metaParts.join(' · ') }}
  </p>
</template>

<style scoped>
.news-meta-section {
  margin-top: -0.25em;
  margin-bottom: 0.75em;
  font-size: 0.78em;
  padding-left: 1rem;
  color: var(--color-fg-muted);
}
</style>
