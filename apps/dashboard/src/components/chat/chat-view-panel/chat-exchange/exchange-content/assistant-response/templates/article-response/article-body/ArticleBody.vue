<script setup lang="ts">
import ArticleLeadSection from '../../../sections/article-lead-section/ArticleLeadSection.vue';
import ArticleQuoteSection from '../../../sections/article-quote-section/ArticleQuoteSection.vue';
import ParagraphSection from '../../../sections/paragraph-section/ParagraphSection.vue';
import type { ArticleBodyProps } from './ArticleBody.types';

defineProps<ArticleBodyProps>();
</script>

<template>
  <ArticleLeadSection v-if="showLead" :summary="summary" />
  <div :class="['article-body', { 'article-body--multicol': multicol }]">
    <ParagraphSection :title="sectionTitle" :content="sectionContent" />
  </div>
  <ArticleQuoteSection :quote="quote" />
</template>

<style scoped>
@media (min-width: 720px) {
  /* Newspaper columns: multicol auto-balances variable-length copy. */
  .article-body--multicol :deep(.content p) {
    columns: 2;
    column-gap: 2em;
    column-rule: 1px solid var(--color-divider);
    background-color: var(--color-bg-tertiary);
    padding: 1rem;
  }
}
</style>
