<script setup lang="ts">
import { useHarnessMediaPriority } from '@/components/chat/chat-view-panel/chat-exchange/exchange-content/assistant-response/shared/composables/use-harness-media-priority.composable';
import ArticleHero from '@/components/chat/chat-view-panel/chat-exchange/exchange-content/assistant-response/shared/ui/article-hero/ArticleHero.vue';
import MediaGalleries from '@/components/chat/chat-view-panel/chat-exchange/exchange-content/assistant-response/shared/ui/media-galleries/MediaGalleries.vue';
import SectionTitle from '@/components/chat/shared/ui/section-title/SectionTitle.vue';

import ArticleCardsSection from '../../sections/article-cards-section/ArticleCardsSection.vue';
import ArticleLeadSection from '../../sections/article-lead-section/ArticleLeadSection.vue';
import EmptyStateSection from '../../sections/empty-state-section/EmptyStateSection.vue';
import InternationalCoverageSection from '../../sections/international-coverage-section/InternationalCoverageSection.vue';
import KeyFindingsSection from '../../sections/key-findings-section/KeyFindingsSection.vue';
import ParagraphSection from '../../sections/paragraph-section/ParagraphSection.vue';
import SourcesSection from '../../sections/sources-section/SourcesSection.vue';
import { useEvaluationResponseData } from '../evaluation-response/composables/use-evaluation-response-data.composable';
import EvaluationComparisonSection from '../evaluation-response/sections/evaluation-comparison-section/EvaluationComparisonSection.vue';
import EvaluationListSection from '../evaluation-response/sections/evaluation-list-section/EvaluationListSection.vue';
import EvaluationSubjectProfile from '../evaluation-response/sections/evaluation-subject-profile/EvaluationSubjectProfile.vue';
import { hasAnyMergeContent } from './helpers/has-any-merge-content.helper';
import MergeBodySection from './merge-body-section/MergeBodySection.vue';
import type { MergeResponseProps } from './MergeResponse.types';

const props = defineProps<MergeResponseProps>();

const { subjectProfiles, comparisonView, isMultiSubject } =
  useEvaluationResponseData(props);
const { videosFirst } = useHarnessMediaPriority(props.data);
</script>

<template>
  <article class="merge-response">
    <template v-if="hasAnyMergeContent(data)">
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
        :on-image-click="onImageClick"
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

      <MediaGalleries
        :videos-first="videosFirst"
        :video-gallery-title="data.videoGalleryTitle"
        :video-gallery-items="data.videoGalleryItems"
        :gallery-title="data.galleryTitle"
        :gallery-items="data.galleryItems"
        :on-image-click="onImageClick"
      />

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
.merge-response {
  display: flex;
  flex-direction: column;
  gap: 1.25em;
}
</style>
