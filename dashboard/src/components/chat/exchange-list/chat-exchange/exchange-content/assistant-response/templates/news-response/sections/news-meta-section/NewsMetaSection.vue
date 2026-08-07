<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  dateline?: string;
  publishDate?: string;
  readTime?: string;
  byline?: string;
}>();

const { t } = useI18n();

const metaParts = computed(() => {
  const parts: string[] = [];
  if (props.dateline) parts.push(props.dateline);
  if (props.publishDate)
    parts.push(t('meta.published', { date: props.publishDate }));
  if (props.readTime) parts.push(t('meta.readTime', { value: props.readTime }));
  if (props.byline) parts.push(t('meta.by', { byline: props.byline }));
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
