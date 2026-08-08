<script setup lang="ts">
import ArticleHeroMediaSection from '../../sections/article-hero-media-section/ArticleHeroMediaSection.vue';
import ArticleLeadSection from '../../sections/article-lead-section/ArticleLeadSection.vue';
import GallerySection from '../../sections/gallery-section/GallerySection.vue';
import HeroSection from '../../sections/hero-section/HeroSection.vue';
import InternationalCoverageSection from '../../sections/international-coverage-section/InternationalCoverageSection.vue';
import KeyFindingsSection from '../../sections/key-findings-section/KeyFindingsSection.vue';
import ParagraphSection from '../../sections/paragraph-section/ParagraphSection.vue';
import SourcesSection from '../../sections/sources-section/SourcesSection.vue';
import VideoGallerySection from '../../sections/video-gallery-section/VideoGallerySection.vue';
import { useArtDirection } from '../../shared/composables/use-art-direction.composable';
import { useNewsResponseData } from './composables/use-news-response-data.composable';
import RelatedStoriesSection from './sections/related-stories-section/RelatedStoriesSection.vue';
import type { NewsResponseProps } from './NewsResponse.types';

const props = defineProps<NewsResponseProps>();

const { videosFirst, hasAnyContent } = useNewsResponseData(props);
const { direction, splitHero, multicolBody, mosaicGallery, spans } =
  useArtDirection(props);
</script>

<template>
  <article class="news" :class="`news--${direction}`">
    <template v-if="hasAnyContent">
      <header v-if="splitHero" class="news__hero news__hero--split">
        <ArticleHeroMediaSection
          :hero-video-url="data.heroVideoUrl"
          :hero-video-caption="data.heroVideoCaption"
          :hero-video-title="data.heroVideoTitle"
          :hero-image-url="data.heroImageUrl"
          :hero-image-alt="data.heroImageAlt"
          :hero-caption="data.heroCaption"
        />
        <div class="news__hero-stack">
          <HeroSection :title="data.headline" :subtitle="data.deck" />
          <ArticleLeadSection :summary="data.lead" />
        </div>
      </header>
      <template v-else>
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
      </template>

      <div :class="['news__body', { 'news__body--multicol': multicolBody }]">
        <ParagraphSection
          :title="data.sectionTitle"
          :content="data.sectionContent"
        />
      </div>
      <template v-if="videosFirst">
        <VideoGallerySection
          :title="data.videoGalleryTitle"
          :items="data.videoGalleryItems"
        />
        <GallerySection
          :title="data.galleryTitle"
          :items="data.galleryItems"
          :mosaic="mosaicGallery"
        />
      </template>
      <template v-else>
        <GallerySection
          :title="data.galleryTitle"
          :items="data.galleryItems"
          :mosaic="mosaicGallery"
        />
        <VideoGallerySection
          :title="data.videoGalleryTitle"
          :items="data.videoGalleryItems"
        />
      </template>
      <RelatedStoriesSection :items="data.relatedStories" :spans="spans" />
      <KeyFindingsSection
        :items="data.keyFindings"
        :title="$t('common.keyFindings')"
      />
      <InternationalCoverageSection :items="data.internationalCoverage" />
      <SourcesSection :items="data.sources" />
    </template>

    <section v-else class="news__empty">
      <h3>{{ $t('common.noResultsFound') }}</h3>
      <p>
        {{ $t('common.noResultsExplain') }}
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

/* Split direction (ar2): the hero media panel sits beside the
   headline/meta-rule/lead stack instead of below the headline. */
.news__hero--split {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25em;
}

.news__hero-stack {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  min-width: 0;
}

@media (min-width: 720px) {
  .news__hero--split {
    grid-template-columns: 1fr 1fr;
    align-items: start;
  }

  .news__hero--split :deep(.hero-media-card) {
    margin-top: 0;
  }

  /* Newspaper columns: multicol auto-balances variable-length copy. */
  .news__body--multicol :deep(.content p) {
    columns: 2;
    column-gap: 2em;
    column-rule: 1px solid var(--color-divider);
  }
}

.news__empty {
  padding: 1.5em;
  border: 1px solid var(--color-divider);
  background: var(--color-bg-tertiary);
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
