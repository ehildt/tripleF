<script setup lang="ts">
import ParagraphSection from '../../../sections/paragraph-section/ParagraphSection.vue';
import SectionTitle from '../../../shared/ui/section-title/SectionTitle.vue';
import { useEvaluationResponseData } from '../../evaluation-response/composables/use-evaluation-response-data.composable';
import EvaluationComparisonSection from '../../evaluation-response/sections/evaluation-comparison-section/EvaluationComparisonSection.vue';
import EvaluationListSection from '../../evaluation-response/sections/evaluation-list-section/EvaluationListSection.vue';
import EvaluationSubjectProfile from '../../evaluation-response/sections/evaluation-subject-profile/EvaluationSubjectProfile.vue';
import type { MergeEvaluationGroupProps } from './MergeEvaluationGroup.types';

const props = defineProps<MergeEvaluationGroupProps>();

/**
 * The group carries the same evaluation fields the evaluation template
 * consumes (subjects, comparison, reasoning) — deriving through its
 * composable keeps profiles and the comparison matrix identical, including
 * the single-subject verdict reshaping.
 */
const { subjectProfiles, comparisonView, isMultiSubject } =
  useEvaluationResponseData({ data: props.evaluation });
</script>

<template>
  <section class="merge-evaluation-group">
    <SectionTitle v-if="evaluation.title" :title="evaluation.title" />

    <p v-if="evaluation.relationNote" class="merge-evaluation-group__note">
      {{ evaluation.relationNote }}
    </p>

    <ParagraphSection
      v-if="evaluation.introduction"
      :title="$t('common.introduction')"
      :content="evaluation.introduction"
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

    <ParagraphSection
      v-if="evaluation.reasoning"
      :title="$t('common.reasoning')"
      :content="evaluation.reasoning"
    />

    <EvaluationListSection
      :title="$t('common.recommendations')"
      variant="recommendation"
      :items="evaluation.recommendations"
    />
  </section>
</template>

<style scoped>
.merge-evaluation-group {
  display: flex;
  flex-direction: column;
  gap: 1.25em;
}

.merge-evaluation-group__note {
  margin: 0;
  font-style: italic;
  color: var(--color-fg-secondary);
}
</style>
