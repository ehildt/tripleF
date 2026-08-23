<script setup lang="ts">
import ResponseHeader from '../../../../shared/ui/response-header/ResponseHeader.vue';
import EvaluationListSection from '../evaluation-list-section/EvaluationListSection.vue';
import type { EvaluationSubjectProfileProps } from './EvaluationSubjectProfile.types';

defineProps<EvaluationSubjectProfileProps>();
</script>

<template>
  <section class="evaluation-subject-profile">
    <ResponseHeader as="h3" size="sm" :title="name" ruled>
      <span v-if="scoreText" class="evaluation-subject-profile__score">
        {{ scoreText }}
      </span>
    </ResponseHeader>
    <p v-if="description" class="evaluation-subject-profile__description">
      {{ description }}
    </p>
    <EvaluationListSection
      :title="$t('common.strengths')"
      variant="strength"
      :items="strengths"
    />
    <EvaluationListSection
      :title="$t('common.weaknesses')"
      variant="weakness"
      :items="weaknesses"
    />
  </section>
</template>

<style scoped>
.evaluation-subject-profile {
  display: flex;
  flex-direction: column;
  gap: 0.5em;
  background-color: var(--color-bg-tertiary);
  padding: var(--spacing-3);
}

.evaluation-subject-profile__score {
  flex-shrink: 0;
  font-size: 1.1em;
  font-weight: 700;
  color: var(--color-accent-primary);
}

.evaluation-subject-profile__description {
  margin: 0;
  color: var(--color-fg-secondary);
  line-height: 1.6;
  white-space: pre-line;
  margin-bottom: var(--spacing-3);
}
</style>
