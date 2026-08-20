<script setup lang="ts">
import ArticleLeadSection from '../../sections/article-lead-section/ArticleLeadSection.vue';
import EmptyStateSection from '../../sections/empty-state-section/EmptyStateSection.vue';
import InternationalCoverageSection from '../../sections/international-coverage-section/InternationalCoverageSection.vue';
import KeyFindingsSection from '../../sections/key-findings-section/KeyFindingsSection.vue';
import ParagraphSection from '../../sections/paragraph-section/ParagraphSection.vue';
import SourcesSection from '../../sections/sources-section/SourcesSection.vue';
import { useArtDirection } from '../../shared/composables/use-art-direction.composable';
import ArticleHero from '../../shared/ui/article-hero/ArticleHero.vue';
import MediaGalleries from '../../shared/ui/media-galleries/MediaGalleries.vue';
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
      <ArticleHero
        :title="data.headline"
        :subtitle="data.deck"
        :split="splitHero"
        :hero-video-url="data.heroVideoUrl"
        :hero-video-caption="data.heroVideoCaption"
        :hero-video-title="data.heroVideoTitle"
        :hero-image-url="data.heroImageUrl"
        :hero-image-alt="data.heroImageAlt"
        :hero-caption="data.heroCaption"
      >
        <template #lead>
          <ArticleLeadSection :summary="data.lead" />
        </template>
      </ArticleHero>
      <!-- Stacked direction: the lead sits below the hero region. -->
      <ArticleLeadSection v-if="!splitHero" :summary="data.lead" />

      <div :class="['news__body', { 'news__body--multicol': multicolBody }]">
        <ParagraphSection
          :title="data.sectionTitle"
          :content="data.sectionContent"
        />
      </div>
      <MediaGalleries
        :videos-first="videosFirst"
        :video-gallery-title="data.videoGalleryTitle"
        :video-gallery-items="data.videoGalleryItems"
        :gallery-title="data.galleryTitle"
        :gallery-items="data.galleryItems"
        :mosaic="mosaicGallery"
      />
      <RelatedStoriesSection :items="data.relatedStories" :spans="spans" />
      <KeyFindingsSection
        :items="data.keyFindings"
        :title="$t('common.keyFindings')"
      />
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
.news {
  display: flex;
  flex-direction: column;
  gap: 1.25em;
}

/* Newspaper columns: multicol auto-balances variable-length copy. */
@media (min-width: 720px) {
  .news__body--multicol :deep(.content p) {
    columns: 2;
    column-gap: 2em;
    column-rule: 1px solid var(--color-divider);
  }
}
</style>
