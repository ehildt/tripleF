<script setup lang="ts">
import ArticleCardsSection from '../../sections/article-cards-section/ArticleCardsSection.vue';
import ArticleConclusionSection from '../../sections/article-conclusion-section/ArticleConclusionSection.vue';
import ArticleHeroMediaSection from '../../sections/article-hero-media-section/ArticleHeroMediaSection.vue';
import ArticleLeadSection from '../../sections/article-lead-section/ArticleLeadSection.vue';
import GallerySection from '../../sections/gallery-section/GallerySection.vue';
import HeroSection from '../../sections/hero-section/HeroSection.vue';
import InternationalCoverageSection from '../../sections/international-coverage-section/InternationalCoverageSection.vue';
import KeyFindingsSection from '../../sections/key-findings-section/KeyFindingsSection.vue';
import SourcesSection from '../../sections/sources-section/SourcesSection.vue';
import VideoGallerySection from '../../sections/video-gallery-section/VideoGallerySection.vue';
import { useArtDirection } from '../../shared/composables/use-art-direction.composable';
import { useHarnessMediaPriority } from '../../shared/composables/use-harness-media-priority.composable';
import ArticleBody from './article-body/ArticleBody.vue';
import ArticleEditorialBody from './article-editorial-body/ArticleEditorialBody.vue';
import type { ArticleResponseProps } from './ArticleResponse.types';

const props = defineProps<ArticleResponseProps>();

const { videosFirst } = useHarnessMediaPriority(props.data);
const { direction, splitHero, quoteAside, multicolBody, mosaicGallery, spans } =
  useArtDirection(props);
</script>

<template>
  <article class="article" :class="`article--${direction}`">
    <header v-if="splitHero" class="article__hero article__hero--split">
      <ArticleHeroMediaSection
        :hero-video-url="data.heroVideoUrl"
        :hero-video-caption="data.heroVideoCaption"
        :hero-video-title="data.heroVideoTitle"
        :hero-image-url="data.heroImageUrl"
        :hero-image-alt="data.heroImageAlt"
        :hero-caption="data.heroCaption"
      />
      <div class="article__hero-stack">
        <HeroSection :title="data.title" :subtitle="data.subtitle" />
        <hr class="article__meta-rule" />
        <ArticleLeadSection :summary="data.summary" />
      </div>
    </header>
    <header v-else class="hero">
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

    <!-- Editorial direction (ar1): body prose beside an enlarged pull-quote
         aside; the quote leaves its classic inline slot. -->
    <ArticleEditorialBody
      v-if="quoteAside"
      :summary="data.summary"
      :section-title="data.sectionTitle"
      :section-content="data.sectionContent"
      :quote="data.quote"
    />
    <ArticleBody
      v-else
      :show-lead="!splitHero"
      :summary="data.summary"
      :section-title="data.sectionTitle"
      :section-content="data.sectionContent"
      :quote="data.quote"
      :multicol="multicolBody"
    />

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
    <ArticleCardsSection
      :title="data.cardsTitle"
      :items="data.cards"
      :spans="spans"
    />
    <KeyFindingsSection
      :items="data.keyFindings"
      :title="$t('common.keyFindings')"
    />
    <InternationalCoverageSection :items="data.internationalCoverage" />
    <ArticleConclusionSection :conclusion="data.conclusion" />
    <SourcesSection :items="data.sources" />
  </article>
</template>

<style scoped>
.article {
  display: flex;
  flex-direction: column;
  gap: 1.25em;
}

/* Split direction (ar2): the hero media panel sits beside the
   title/meta-rule/summary stack instead of below the title. */
.article__hero--split {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25em;
}

.article__hero-stack {
  display: flex;
  flex-direction: column;
  gap: 0.75em;
  min-width: 0;
}

.article__meta-rule {
  border: none;
  border-top: 1px solid var(--color-divider);
  margin: 0;
}

@media (min-width: 720px) {
  .article__hero--split {
    grid-template-columns: 1fr 1fr;
    align-items: start;
  }

  .article__hero--split :deep(.hero-media-card) {
    margin-top: 0;
  }
}
</style>
