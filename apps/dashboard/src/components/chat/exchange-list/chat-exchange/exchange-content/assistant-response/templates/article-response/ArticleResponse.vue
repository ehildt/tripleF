<script setup lang="ts">
import ArticleCardsSection from '../../sections/article-cards-section/ArticleCardsSection.vue';
import ArticleConclusionSection from '../../sections/article-conclusion-section/ArticleConclusionSection.vue';
import ArticleLeadSection from '../../sections/article-lead-section/ArticleLeadSection.vue';
import InternationalCoverageSection from '../../sections/international-coverage-section/InternationalCoverageSection.vue';
import KeyFindingsSection from '../../sections/key-findings-section/KeyFindingsSection.vue';
import SourcesSection from '../../sections/sources-section/SourcesSection.vue';
import { useArtDirection } from '../../shared/composables/use-art-direction.composable';
import { useHarnessMediaPriority } from '../../shared/composables/use-harness-media-priority.composable';
import ArticleHero from '../../shared/ui/article-hero/ArticleHero.vue';
import MediaGalleries from '../../shared/ui/media-galleries/MediaGalleries.vue';
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
    <ArticleHero
      :title="data.title"
      :subtitle="data.subtitle"
      :split="splitHero"
      :hero-video-url="data.heroVideoUrl"
      :hero-video-caption="data.heroVideoCaption"
      :hero-video-title="data.heroVideoTitle"
      :hero-image-url="data.heroImageUrl"
      :hero-image-alt="data.heroImageAlt"
      :hero-caption="data.heroCaption"
    >
      <template #lead>
        <ArticleLeadSection :summary="data.summary" />
      </template>
    </ArticleHero>

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

    <MediaGalleries
      :videos-first="videosFirst"
      :video-gallery-title="data.videoGalleryTitle"
      :video-gallery-items="data.videoGalleryItems"
      :gallery-title="data.galleryTitle"
      :gallery-items="data.galleryItems"
      :mosaic="mosaicGallery"
    />
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
</style>
