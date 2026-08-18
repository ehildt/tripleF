<script setup lang="ts">
import { computed } from 'vue';

import ArticleCardsSection from '../../sections/article-cards-section/ArticleCardsSection.vue';
import ArticleHeroMediaSection from '../../sections/article-hero-media-section/ArticleHeroMediaSection.vue';
import ArticleLeadSection from '../../sections/article-lead-section/ArticleLeadSection.vue';
import EmptyStateSection from '../../sections/empty-state-section/EmptyStateSection.vue';
import GallerySection from '../../sections/gallery-section/GallerySection.vue';
import HeroSection from '../../sections/hero-section/HeroSection.vue';
import InternationalCoverageSection from '../../sections/international-coverage-section/InternationalCoverageSection.vue';
import KeyFindingsSection from '../../sections/key-findings-section/KeyFindingsSection.vue';
import ParagraphSection from '../../sections/paragraph-section/ParagraphSection.vue';
import SourcesSection from '../../sections/sources-section/SourcesSection.vue';
import VideoGallerySection from '../../sections/video-gallery-section/VideoGallerySection.vue';
import SectionTitle from '../../shared/ui/section-title/SectionTitle.vue';
import { useEvaluationResponseData } from '../evaluation-response/composables/use-evaluation-response-data.composable';
import EvaluationComparisonSection from '../evaluation-response/sections/evaluation-comparison-section/EvaluationComparisonSection.vue';
import EvaluationListSection from '../evaluation-response/sections/evaluation-list-section/EvaluationListSection.vue';
import EvaluationSubjectProfile from '../evaluation-response/sections/evaluation-subject-profile/EvaluationSubjectProfile.vue';
import MergeBodySection from './merge-body-section/MergeBodySection.vue';
import type { MergeResponseProps } from './MergeResponse.types';

const props = defineProps<MergeResponseProps>();

const { subjectProfiles, comparisonView, isMultiSubject, videosFirst } =
  useEvaluationResponseData(props);

const hasAnyContent = computed(() =>
  Boolean(
    props.data.category ||
    props.data.title ||
    props.data.subtitle ||
    props.data.summary ||
    props.data.introduction ||
    props.data.subject ||
    props.data.verdict ||
    props.data.reasoning ||
    props.data.strengths?.length ||
    props.data.weaknesses?.length ||
    props.data.recommendations?.length ||
    props.data.subjects?.length ||
    props.data.comparison ||
    props.data.mergedEvaluations?.length ||
    props.data.bodySections?.length ||
    props.data.sectionTitle ||
    props.data.sectionContent ||
    props.data.keyFindings?.length ||
    props.data.cards?.length ||
    props.data.galleryItems?.length ||
    props.data.videoGalleryItems?.length ||
    props.data.sources?.length ||
    props.data.internationalCoverage?.length ||
    props.data.heroImageUrl ||
    props.data.heroVideoUrl,
  ),
);
</script>

<template>
  <article class="harness-merge">
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

      <ArticleLeadSection :summary="data.summary" />

      <ParagraphSection
        v-if="data.introduction"
        :title="$t('common.introduction')"
        :content="data.introduction"
      />

      <template v-if="data.mergedEvaluations?.length">
        <MergeEvaluationGroup
          v-for="(evaluation, index) in data.mergedEvaluations"
          :key="index"
          :evaluation="evaluation"
        />
      </template>
      <template v-else>
        <EvaluationSubjectProfile
          v-for="(profile, index) in subjectProfiles"
          :key="index"
          v-bind="profile"
        />

        <EvaluationComparisonSection
          v-if="comparisonView"
          :title="
            isMultiSubject
              ? $t('common.comparison')
              : $t('common.verdictHeading')
          "
          v-bind="comparisonView"
        />

        <ParagraphSection
          v-if="data.reasoning"
          :title="$t('common.reasoning')"
          :content="data.reasoning"
        />

        <EvaluationListSection
          :title="$t('common.strengths')"
          variant="strength"
          :items="data.strengths"
        />
        <EvaluationListSection
          :title="$t('common.weaknesses')"
          variant="weakness"
          :items="data.weaknesses"
        />
        <EvaluationListSection
          :title="$t('common.recommendations')"
          variant="recommendation"
          :items="data.recommendations"
        />
      </template>

      <template v-if="data.bodySections?.length">
        <SectionTitle v-if="data.sectionTitle" :title="data.sectionTitle" />
        <MergeBodySection
          v-for="(section, index) in data.bodySections"
          :key="index"
          :section="section"
        />
      </template>
      <!-- Legacy merges (pre-bodySections) still carry the narrative as one
           sectionContent string — keep rendering it so persisted
           conversations don't lose their body. -->
      <ParagraphSection
        v-else
        :title="data.sectionTitle"
        :content="data.sectionContent"
      />

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

      <ArticleCardsSection :title="data.cardsTitle" :items="data.cards" />
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
.harness-merge {
  display: flex;
  flex-direction: column;
  gap: 1.25em;
}
</style>
