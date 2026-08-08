<script setup lang="ts">
import EvaluationListSection from '../evaluation-list-section/EvaluationListSection.vue';
import type { EvaluationSubjectProfileProps } from './EvaluationSubjectProfile.types';

defineProps<EvaluationSubjectProfileProps>();
</script>

<template>
  <section class="evaluation-subject-profile">
    <header class="evaluation-subject-profile__header">
      <h3 class="evaluation-subject-profile__name">{{ name }}</h3>
      <span v-if="scoreText" class="evaluation-subject-profile__score">
        {{ scoreText }}
      </span>
    </header>
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

.evaluation-subject-profile__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1em;
  padding-bottom: 0.25em;
  border-bottom: 1px solid var(--color-divider);
}

.evaluation-subject-profile__name {
  margin: 0;
  font-size: 1.1em;
  color: var(--color-fg-primary);
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
