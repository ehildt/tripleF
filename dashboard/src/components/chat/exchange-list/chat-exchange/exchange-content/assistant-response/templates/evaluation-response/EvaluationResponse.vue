<script setup lang="ts">
import { computed } from 'vue';

import type { HarnessResponseData } from '@/types/harness-response-data.model';

import ArticleHeroMediaSection from '../../sections/article-hero-media-section/ArticleHeroMediaSection.vue';
import GallerySection from '../../sections/gallery-section/GallerySection.vue';
import HeroSection from '../../sections/hero-section/HeroSection.vue';
import InternationalCoverageSection from '../../sections/international-coverage-section/InternationalCoverageSection.vue';
import ParagraphSection from '../../sections/paragraph-section/ParagraphSection.vue';
import SourcesSection from '../../sections/sources-section/SourcesSection.vue';
import VideoGallerySection from '../../sections/video-gallery-section/VideoGallerySection.vue';
import EvaluationListSection from './sections/evaluation-list-section/EvaluationListSection.vue';

const props = defineProps<{
  data: HarnessResponseData;
}>();

const heroUrl = computed(
  () => props.data.heroVideoUrl || props.data.heroImageUrl,
);

const hasAnyContent = computed(() =>
  Boolean(
    props.data.category ||
    props.data.title ||
    props.data.subtitle ||
    props.data.subject ||
    props.data.verdict ||
    props.data.score !== undefined ||
    props.data.reasoning ||
    props.data.strengths?.length ||
    props.data.weaknesses?.length ||
    props.data.recommendations?.length ||
    props.data.sources?.length ||
    heroUrl.value ||
    props.data.videoGalleryItems?.length ||
    props.data.galleryItems?.length,
  ),
);
</script>

<template>
  <article class="harness-evaluation">
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

      <section v-if="data.subject || data.verdict" class="overview">
        <p v-if="data.subject" class="subject">
          <strong>Subject:</strong> {{ data.subject }}
        </p>
        <p v-if="data.verdict" class="verdict">
          <strong>Verdict:</strong> {{ data.verdict }}
        </p>
      </section>

      <ParagraphSection title="Reasoning" :content="data.reasoning" />

      <EvaluationListSection
        title="Strengths"
        variant="strength"
        :items="data.strengths"
      />
      <EvaluationListSection
        title="Weaknesses"
        variant="weakness"
        :items="data.weaknesses"
      />
      <EvaluationListSection
        title="Recommendations"
        variant="recommendation"
        :items="data.recommendations"
      />

      <GallerySection :title="data.galleryTitle" :items="data.galleryItems" />
      <VideoGallerySection
        :title="data.videoGalleryTitle"
        :items="data.videoGalleryItems"
      />

      <SourcesSection :items="data.sources" />
      <InternationalCoverageSection :items="data.internationalCoverage" />
    </template>

    <section v-else class="evaluation__empty">
      <h3>No results found</h3>
      <p>
        The search did not return any authoritative sources for this request.
      </p>
    </section>
  </article>
</template>

<style scoped>
.harness-evaluation {
  display: flex;
  flex-direction: column;
  gap: 1.25em;
}

.hero {
  display: flex;
  flex-direction: column;
  gap: 0.75em;
}

.overview {
  display: flex;
  flex-direction: column;
  gap: 0.35em;
  padding: 0.75em 1em;
  border: 1px solid var(--color-divider);
  background: var(--color-bg-secondary);
}

.subject,
.verdict {
  margin: 0;
  color: var(--color-fg-secondary);
  line-height: 1.5;
}

.verdict {
  font-weight: 500;
}

.evaluation__empty {
  padding: 1.5em;
  border: 1px solid var(--color-divider);
  background: var(--color-bg-secondary);
  text-align: center;
}

.evaluation__empty h3 {
  margin: 0 0 0.5em;
  font-size: 1.1em;
  color: var(--color-fg-primary);
}

.evaluation__empty p {
  margin: 0;
  color: var(--color-fg-secondary);
  font-size: 0.95em;
}
</style>
