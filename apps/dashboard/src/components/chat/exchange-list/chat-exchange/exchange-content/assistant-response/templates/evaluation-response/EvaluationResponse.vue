<script setup lang="ts">
import ArticleLeadSection from '../../sections/article-lead-section/ArticleLeadSection.vue';
import EmptyStateSection from '../../sections/empty-state-section/EmptyStateSection.vue';
import InternationalCoverageSection from '../../sections/international-coverage-section/InternationalCoverageSection.vue';
import ParagraphSection from '../../sections/paragraph-section/ParagraphSection.vue';
import SourcesSection from '../../sections/sources-section/SourcesSection.vue';
import { useArtDirection } from '../../shared/composables/use-art-direction.composable';
import ArticleHero from '../../shared/ui/article-hero/ArticleHero.vue';
import MediaGalleries from '../../shared/ui/media-galleries/MediaGalleries.vue';
import { useEvaluationResponseData } from './composables/use-evaluation-response-data.composable';
import EvaluationComparisonSection from './sections/evaluation-comparison-section/EvaluationComparisonSection.vue';
import EvaluationListSection from './sections/evaluation-list-section/EvaluationListSection.vue';
import EvaluationSubjectProfile from './sections/evaluation-subject-profile/EvaluationSubjectProfile.vue';
import type { EvaluationResponseProps } from './EvaluationResponse.types';

const props = defineProps<EvaluationResponseProps>();

const {
  videosFirst,
  subjectProfiles,
  isMultiSubject,
  comparisonView,
  hasAnyContent,
} = useEvaluationResponseData(props);
const { direction, splitHero, mosaicGallery } = useArtDirection(props);
</script>

<template>
  <article
    class="harness-evaluation"
    :class="`harness-evaluation--${direction}`"
  >
    <template v-if="hasAnyContent">
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
          <ArticleLeadSection :summary="data.introduction" />
        </template>
      </ArticleHero>

      <ParagraphSection
        v-if="data.introduction && !splitHero"
        :title="$t('common.introduction')"
        :content="data.introduction"
      />

      <EvaluationSubjectProfile
        v-for="(profile, index) in subjectProfiles"
        :key="index"
        v-bind="profile"
      />

      <EvaluationComparisonSection
        v-if="comparisonView"
        :title="
          isMultiSubject ? $t('common.comparison') : $t('common.verdictHeading')
        "
        v-bind="comparisonView"
      />

      <EvaluationListSection
        :title="$t('common.recommendations')"
        variant="recommendation"
        :items="data.recommendations"
      />

      <MediaGalleries
        :videos-first="videosFirst"
        :video-gallery-title="data.videoGalleryTitle"
        :video-gallery-items="data.videoGalleryItems"
        :gallery-title="data.galleryTitle"
        :gallery-items="data.galleryItems"
        :mosaic="mosaicGallery"
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
.harness-evaluation {
  display: flex;
  flex-direction: column;
  gap: 1.25em;
}
</style>
