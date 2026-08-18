<script setup lang="ts">
import ArticleHeroMediaSection from '../../sections/article-hero-media-section/ArticleHeroMediaSection.vue';
import EmptyStateSection from '../../sections/empty-state-section/EmptyStateSection.vue';
import GallerySection from '../../sections/gallery-section/GallerySection.vue';
import HeroSection from '../../sections/hero-section/HeroSection.vue';
import InternationalCoverageSection from '../../sections/international-coverage-section/InternationalCoverageSection.vue';
import KeyFindingsSection from '../../sections/key-findings-section/KeyFindingsSection.vue';
import ParagraphSection from '../../sections/paragraph-section/ParagraphSection.vue';
import SourcesSection from '../../sections/sources-section/SourcesSection.vue';
import VideoGallerySection from '../../sections/video-gallery-section/VideoGallerySection.vue';
import { useSummaryResponseData } from './composables/use-summary-response-data.composable';
import type { SummaryResponseProps } from './SummaryResponse.types';

const props = defineProps<SummaryResponseProps>();

const { videosFirst, hasAnyContent } = useSummaryResponseData(props);
</script>

<template>
  <article class="harness-summary">
    <template v-if="hasAnyContent">
      <header class="hero">
        <HeroSection :title="data.title" :subtitle="data.subtitle" />
      </header>

      <ArticleHeroMediaSection
        :hero-video-url="data.heroVideoUrl"
        :hero-video-caption="data.heroVideoCaption"
        :hero-video-title="data.heroVideoTitle"
        :hero-image-url="data.heroImageUrl"
        :hero-image-alt="data.heroImageAlt"
        :hero-caption="data.heroCaption"
      />

      <ParagraphSection :title="$t('common.summary')" :content="data.summary" />
      <KeyFindingsSection
        :items="data.keyFindings"
        :title="$t('common.keyFindings')"
      />
      <template v-if="videosFirst">
        <VideoGallerySection
          :title="data.videoGalleryTitle"
          :items="data.videoGalleryItems"
        />
        <GallerySection :title="data.galleryTitle" :items="data.galleryItems" />
      </template>
      <template v-else>
        <GallerySection :title="data.galleryTitle" :items="data.galleryItems" />
        <VideoGallerySection
          :title="data.videoGalleryTitle"
          :items="data.videoGalleryItems"
        />
      </template>
      <InternationalCoverageSection :items="data.internationalCoverage" />
      <SourcesSection :items="data.sources" />
    </template>

    <EmptyStateSection
      v-else
      :title="$t('common.noResultsFound')"
      :message="$t('common.noResultsExplain')"
    />
  </article>
</template>

<style scoped>
.harness-summary {
  display: flex;
  flex-direction: column;
  gap: 1.25em;
}
</style>
