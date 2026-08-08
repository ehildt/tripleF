<script setup lang="ts">
import ArticleHeroMediaSection from '../../sections/article-hero-media-section/ArticleHeroMediaSection.vue';
import ArticleLeadSection from '../../sections/article-lead-section/ArticleLeadSection.vue';
import GallerySection from '../../sections/gallery-section/GallerySection.vue';
import HeroSection from '../../sections/hero-section/HeroSection.vue';
import InternationalCoverageSection from '../../sections/international-coverage-section/InternationalCoverageSection.vue';
import ParagraphSection from '../../sections/paragraph-section/ParagraphSection.vue';
import SourcesSection from '../../sections/sources-section/SourcesSection.vue';
import VideoGallerySection from '../../sections/video-gallery-section/VideoGallerySection.vue';
import { useArtDirection } from '../../shared/composables/use-art-direction.composable';
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
      <header v-if="splitHero" class="hero hero--split">
        <ArticleHeroMediaSection
          :hero-video-url="data.heroVideoUrl"
          :hero-video-caption="data.heroVideoCaption"
          :hero-video-title="data.heroVideoTitle"
          :hero-image-url="data.heroImageUrl"
          :hero-image-alt="data.heroImageAlt"
          :hero-caption="data.heroCaption"
        />
        <div class="hero__stack">
          <HeroSection :title="data.title" :subtitle="data.subtitle" />
          <ArticleLeadSection :summary="data.introduction" />
        </div>
      </header>
      <template v-else>
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
      </template>

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

      <template v-if="videosFirst">
        <VideoGallerySection
          :title="data.videoGalleryTitle"
          :items="data.videoGalleryItems"
        />
        <GallerySection
          :title="data.galleryTitle"
          :items="data.galleryItems"
          :mosaic="mosaicGallery"
        />
      </template>
      <template v-else>
        <GallerySection
          :title="data.galleryTitle"
          :items="data.galleryItems"
          :mosaic="mosaicGallery"
        />
        <VideoGallerySection
          :title="data.videoGalleryTitle"
          :items="data.videoGalleryItems"
        />
      </template>

      <InternationalCoverageSection :items="data.internationalCoverage" />
      <SourcesSection :items="data.sources" />
    </template>

    <section v-else class="evaluation__empty">
      <h3>{{ $t('common.noResultsFound') }}</h3>
      <p>
        {{ $t('common.noResultsExplain') }}
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

/* Split direction (ar2): the hero media panel sits beside the
   header stack instead of below the title. */
.hero--split {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25em;
}

.hero__stack {
  display: flex;
  flex-direction: column;
  gap: 0.75em;
  min-width: 0;
  /* Split hero: keep the media panel top-aligned while the title stack
     centers vertically beside it. */
  align-self: center;
  background-color: var(--color-bg-tertiary);
  padding: var(--spacing-3);
  border: 1px solid var(--color-bg-muted);
}

@media (min-width: 720px) {
  .hero--split {
    grid-template-columns: 1fr 1fr;
    align-items: start;
  }

  .hero--split :deep(.hero-media-card) {
    margin-top: 0;
  }
}

.evaluation__empty {
  padding: 1.5em;
  border: 1px solid var(--color-divider);
  background: var(--color-bg-tertiary);
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
