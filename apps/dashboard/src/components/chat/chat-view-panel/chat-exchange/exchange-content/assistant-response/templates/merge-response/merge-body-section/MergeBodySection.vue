<script setup lang="ts">
import ArticleHeroMediaSection from '../../../sections/article-hero-media-section/ArticleHeroMediaSection.vue';
import EvaluationListSection from '../../evaluation-response/sections/evaluation-list-section/EvaluationListSection.vue';
import type { MergeBodySectionProps } from './MergeBodySection.types';

defineProps<MergeBodySectionProps>();
</script>

<template>
  <section class="merge-body-section">
    <h4 class="merge-body-section__topic">{{ section.topic }}</h4>
    <ArticleHeroMediaSection
      :hero-video-url="section.heroVideoUrl"
      :hero-video-caption="section.heroVideoCaption"
      :hero-video-title="section.heroVideoTitle"
      :hero-image-url="section.heroImageUrl"
      :hero-image-alt="section.heroImageAlt"
      :hero-caption="section.heroCaption"
    />
    <p v-if="section.content" class="merge-body-section__content">
      {{ section.content }}
    </p>
    <EvaluationListSection
      :title="$t('common.strengths')"
      variant="strength"
      :items="section.strengths"
    />
    <EvaluationListSection
      :title="$t('common.weaknesses')"
      variant="weakness"
      :items="section.weaknesses"
    />
    <EvaluationListSection
      :title="$t('common.recommendations')"
      variant="recommendation"
      :items="section.recommendations"
    />
  </section>
</template>

<style scoped>
/* One merged topic: the topic heading on top, its own hero media below it,
   then the structured snippet content — the lists and the hero self-hide
   when the model left them empty. */
.merge-body-section {
  display: flex;
  flex-direction: column;
  gap: 0.75em;
  padding: var(--spacing-3);
  background-color: var(--color-bg-tertiary);
}

.merge-body-section__topic {
  margin: 0;
  font-size: 1.1em;
  color: var(--color-fg-primary);
}

/* The hero card carries its own backdrop — inside the topic card it would
   double up, so flatten it and keep only the top spacing. */
.merge-body-section :deep(.hero-media-card) {
  margin: 0.5em 0 0;
  background: transparent;
}

.merge-body-section__content {
  margin: 0;
  line-height: 1.65;
  white-space: pre-line;
  color: var(--color-fg-secondary);
}
</style>
