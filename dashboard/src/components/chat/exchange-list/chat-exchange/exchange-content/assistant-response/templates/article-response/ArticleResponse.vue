<script setup lang="ts">
import { computed } from 'vue';

import type { HarnessResponseData } from '@/types/harness-response-data.model';

import ArticleCardsSection from '../../sections/article-cards-section/ArticleCardsSection.vue';
import ArticleConclusionSection from '../../sections/article-conclusion-section/ArticleConclusionSection.vue';
import ArticleHeroMediaSection from '../../sections/article-hero-media-section/ArticleHeroMediaSection.vue';
import ArticleLeadSection from '../../sections/article-lead-section/ArticleLeadSection.vue';
import ArticleMetaSection from '../../sections/article-meta-section/ArticleMetaSection.vue';
import ArticleQuoteSection from '../../sections/article-quote-section/ArticleQuoteSection.vue';
import GallerySection from '../../sections/gallery-section/GallerySection.vue';
import HeroSection from '../../sections/hero-section/HeroSection.vue';
import KeyFindingsSection from '../../sections/key-findings-section/KeyFindingsSection.vue';
import ParagraphSection from '../../sections/paragraph-section/ParagraphSection.vue';
import SourcesSection from '../../sections/sources-section/SourcesSection.vue';
import VideoGallerySection from '../../sections/video-gallery-section/VideoGallerySection.vue';

const props = defineProps<{
  data: HarnessResponseData;
}>();

const heroUrl = computed(
  () => props.data.heroVideoUrl || props.data.heroImageUrl,
);

const galleryItems = computed(() => {
  const items = props.data.galleryItems ?? [];
  const hero = heroUrl.value;
  if (!hero) return items;
  return items.filter((item) => item.imageUrl !== hero);
});
</script>

<template>
  <article class="article">
    <header class="hero">
      <HeroSection
        :category="data.category"
        :title="data.title"
        :subtitle="data.subtitle"
      />
      <ArticleMetaSection
        :author="data.author"
        :publish-date="data.publishDate"
        :read-time="data.readTime"
      />
      <ArticleHeroMediaSection
        :hero-video-url="data.heroVideoUrl"
        :hero-video-caption="data.heroVideoCaption"
        :hero-image-url="data.heroImageUrl"
        :hero-image-alt="data.heroImageAlt"
        :hero-caption="data.heroCaption"
      />
    </header>

    <ArticleLeadSection :summary="data.summary" />
    <ParagraphSection
      :title="data.sectionTitle"
      :content="data.sectionContent"
    />
    <ArticleQuoteSection :quote="data.quote" />
    <GallerySection :title="data.galleryTitle" :items="galleryItems" />
    <VideoGallerySection
      :title="data.videoGalleryTitle"
      :items="data.videoGalleryItems"
    />
    <ArticleCardsSection :title="data.cardsTitle" :items="data.cards" />
    <KeyFindingsSection title="Key Findings" :items="data.keyFindings" />
    <SourcesSection :items="data.sources" />
    <ArticleConclusionSection :conclusion="data.conclusion" />
  </article>
</template>

<style scoped>
.article {
  display: flex;
  flex-direction: column;
  gap: 1.25em;
}
</style>
