<script setup lang="ts">
import EmptyStateSection from '../../sections/empty-state-section/EmptyStateSection.vue';
import InternationalCoverageSection from '../../sections/international-coverage-section/InternationalCoverageSection.vue';
import KeyFindingsSection from '../../sections/key-findings-section/KeyFindingsSection.vue';
import ParagraphSection from '../../sections/paragraph-section/ParagraphSection.vue';
import SourcesSection from '../../sections/sources-section/SourcesSection.vue';
import ArticleHero from '../../shared/ui/article-hero/ArticleHero.vue';
import MediaGalleries from '../../shared/ui/media-galleries/MediaGalleries.vue';
import { useSummaryResponseData } from './composables/use-summary-response-data.composable';
import type { SummaryResponseProps } from './SummaryResponse.types';

const props = defineProps<SummaryResponseProps>();

const { videosFirst, hasAnyContent } = useSummaryResponseData(props);
</script>

<template>
  <article class="harness-summary">
    <template v-if="hasAnyContent">
      <ArticleHero
        :title="data.title"
        :subtitle="data.subtitle"
        :split="false"
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
      <MediaGalleries
        :videos-first="videosFirst"
        :video-gallery-title="data.videoGalleryTitle"
        :video-gallery-items="data.videoGalleryItems"
        :gallery-title="data.galleryTitle"
        :gallery-items="data.galleryItems"
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
.harness-summary {
  display: flex;
  flex-direction: column;
  gap: 1.25em;
}
</style>
