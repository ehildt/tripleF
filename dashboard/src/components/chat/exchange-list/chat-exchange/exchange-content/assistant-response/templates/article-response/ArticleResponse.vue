<script setup lang="ts">
import type { HarnessResponseData } from '@/types/harness-response-data.model';

import ArticleCardsSection from '../../sections/article-cards-section/ArticleCardsSection.vue';
import ArticleConclusionSection from '../../sections/article-conclusion-section/ArticleConclusionSection.vue';
import ArticleHeroMediaSection from '../../sections/article-hero-media-section/ArticleHeroMediaSection.vue';
import ArticleLeadSection from '../../sections/article-lead-section/ArticleLeadSection.vue';
import ArticleQuoteSection from '../../sections/article-quote-section/ArticleQuoteSection.vue';
import GallerySection from '../../sections/gallery-section/GallerySection.vue';
import HeroSection from '../../sections/hero-section/HeroSection.vue';
import InternationalCoverageSection from '../../sections/international-coverage-section/InternationalCoverageSection.vue';
import KeyFindingsSection from '../../sections/key-findings-section/KeyFindingsSection.vue';
import ParagraphSection from '../../sections/paragraph-section/ParagraphSection.vue';
import SourcesSection from '../../sections/sources-section/SourcesSection.vue';
import VideoGallerySection from '../../sections/video-gallery-section/VideoGallerySection.vue';
import ResponseMetaBarPill from '../../shared/ui/response-meta-bar/response-meta-bar-pill/ResponseMetaBarPill.vue';
import ResponseMetaBar from '../../shared/ui/response-meta-bar/ResponseMetaBar.vue';

defineProps<{
  data: HarnessResponseData;
}>();
</script>

<template>
  <article class="article">
    <header class="hero">
      <ResponseMetaBar>
        <ResponseMetaBarPill v-if="data.category" variant="accent">{{
          data.category
        }}</ResponseMetaBarPill>
        <ResponseMetaBarPill v-if="data.publishDate">{{
          data.publishDate
        }}</ResponseMetaBarPill>
        <ResponseMetaBarPill v-if="data.readTime">{{
          data.readTime
        }}</ResponseMetaBarPill>
        <ResponseMetaBarPill v-if="data.author">{{
          data.author
        }}</ResponseMetaBarPill>
      </ResponseMetaBar>
      <HeroSection :title="data.title" :subtitle="data.subtitle" />
      <ArticleHeroMediaSection
        :hero-video-url="data.heroVideoUrl"
        :hero-video-caption="data.heroVideoCaption"
        :hero-video-title="data.heroVideoTitle"
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
    <GallerySection :title="data.galleryTitle" :items="data.galleryItems" />
    <VideoGallerySection
      :title="data.videoGalleryTitle"
      :items="data.videoGalleryItems"
    />
    <ArticleCardsSection :title="data.cardsTitle" :items="data.cards" />
    <KeyFindingsSection title="Key Findings" :items="data.keyFindings" />
    <SourcesSection :items="data.sources" />
    <InternationalCoverageSection :items="data.internationalCoverage" />
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
