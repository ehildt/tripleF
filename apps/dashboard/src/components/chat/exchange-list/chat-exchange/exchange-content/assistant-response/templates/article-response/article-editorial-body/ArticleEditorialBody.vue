<script setup lang="ts">
import ArticleLeadSection from '../../../sections/article-lead-section/ArticleLeadSection.vue';
import ArticleQuoteSection from '../../../sections/article-quote-section/ArticleQuoteSection.vue';
import ParagraphSection from '../../../sections/paragraph-section/ParagraphSection.vue';
import type { ArticleEditorialBodyProps } from './ArticleEditorialBody.types';

defineProps<ArticleEditorialBodyProps>();
</script>

<template>
  <div
    class="article-editorial-body"
    :class="{ 'article-editorial-body--no-quote': !quote }"
  >
    <ArticleLeadSection
      :summary="summary"
      class="article-editorial-body__lead"
    />
    <ArticleQuoteSection
      :quote="quote"
      class="article-editorial-body__pull-quote"
    />
    <ParagraphSection
      :title="sectionTitle"
      :content="sectionContent"
      class="article-editorial-body__paragraph"
    />
  </div>
</template>

<style scoped>
/* Editorial direction (ar1): lead + pull-quote side by side, body prose
   spanning the full width in its own row below — the long paragraph never
   shares a column with the quote. */
.article-editorial-body {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25em;
}

@media (min-width: 720px) {
  .article-editorial-body {
    grid-template-columns: 3fr 2fr;
    align-items: start;
  }

  /* The long body prose gets the full row — never a half-empty rail. */
  .article-editorial-body__paragraph {
    grid-column: 1 / -1;
  }

  /* No pull quote: the lead takes the full row instead of a 3fr sliver. */
  .article-editorial-body--no-quote .article-editorial-body__lead {
    grid-column: 1 / -1;
  }

  /* Enlarged pull quote: rules top/bottom instead of the inline card. */
  .article-editorial-body :deep(.quote blockquote) {
    border-left: none;
    border-top: 3px solid var(--color-accent-primary);
    border-bottom: 1px solid var(--color-divider);
    background: transparent;
    padding: 0.75em 0;
    font-size: 1.35em;
    line-height: 1.45;
  }
}
</style>
