<script setup lang="ts">
import { computed } from 'vue';

import type { HarnessResponseData } from '@/types/harness-response-data.model';

import ArticleHeroMediaSection from '../../sections/article-hero-media-section/ArticleHeroMediaSection.vue';
import ArticleLeadSection from '../../sections/article-lead-section/ArticleLeadSection.vue';
import GallerySection from '../../sections/gallery-section/GallerySection.vue';
import HeroSection from '../../sections/hero-section/HeroSection.vue';
import InternationalCoverageSection from '../../sections/international-coverage-section/InternationalCoverageSection.vue';
import KeyFindingsSection from '../../sections/key-findings-section/KeyFindingsSection.vue';
import ParagraphSection from '../../sections/paragraph-section/ParagraphSection.vue';
import VideoGallerySection from '../../sections/video-gallery-section/VideoGallerySection.vue';
import SourcesSection from './sections/news-sources-section/NewsSourcesSection.vue';
import RelatedStoriesSection from './sections/related-stories-section/RelatedStoriesSection.vue';

const props = defineProps<{
  data: HarnessResponseData;
}>();

const heroUrl = computed(
  () => props.data.heroVideoUrl || props.data.heroImageUrl,
);

const hasAnyContent = computed(() =>
  Boolean(
    props.data.headline ||
    props.data.deck ||
    props.data.lead ||
    props.data.sectionContent ||
    heroUrl.value ||
    props.data.keyPoints?.length ||
    props.data.sources?.length ||
    props.data.relatedStories?.length ||
    props.data.videoGalleryItems?.length ||
    props.data.galleryItems?.length,
  ),
);
</script>

<template>
  <article class="news">
    <template v-if="hasAnyContent">
      <header class="news__hero">
        <HeroSection :title="data.headline" :subtitle="data.deck" />
        <ArticleHeroMediaSection
          :hero-video-url="data.heroVideoUrl"
          :hero-video-caption="data.heroVideoCaption"
          :hero-video-title="data.heroVideoTitle"
          :hero-image-url="data.heroImageUrl"
          :hero-image-alt="data.heroImageAlt"
          :hero-caption="data.heroCaption"
        />
      </header>

      <ArticleLeadSection :summary="data.lead" />
      <ParagraphSection
        :title="data.sectionTitle"
        :content="data.sectionContent"
      />
      <KeyFindingsSection title="Key Points" :items="data.keyPoints" />
      <GallerySection :title="data.galleryTitle" :items="data.galleryItems" />
      <VideoGallerySection
        :title="data.videoGalleryTitle"
        :items="data.videoGalleryItems"
      />
      <SourcesSection :items="data.sources" />
      <RelatedStoriesSection :items="data.relatedStories" />
      <InternationalCoverageSection :items="data.internationalCoverage" />
    </template>

    <section v-else class="news__empty">
      <h3>No results found</h3>
      <p>
        The search did not return any authoritative sources for this request.
      </p>
    </section>
  </article>
</template>

<style scoped>
.news {
  display: flex;
  flex-direction: column;
  gap: 1.25em;
}

.news__empty {
  padding: 1.5em;
  border: 1px solid var(--color-divider);
  background: var(--color-bg-secondary);
  text-align: center;
}

.news__empty h3 {
  margin: 0 0 0.5em;
  font-size: 1.1em;
  color: var(--color-fg-primary);
}

.news__empty p {
  margin: 0;
  color: var(--color-fg-secondary);
  font-size: 0.95em;
}
</style>
