<script setup lang="ts">
import { computed } from 'vue';

import type { HarnessResponseData } from '@/types/harness-response-data.model';

import ArticleHeroMediaSection from '../../sections/article-hero-media-section/ArticleHeroMediaSection.vue';
import GallerySection from '../../sections/gallery-section/GallerySection.vue';
import HeroSection from '../../sections/hero-section/HeroSection.vue';
import KeyFindingsSection from '../../sections/key-findings-section/KeyFindingsSection.vue';
import ParagraphSection from '../../sections/paragraph-section/ParagraphSection.vue';
import SourcesSection from '../../sections/sources-section/SourcesSection.vue';
import VideoGallerySection from '../../sections/video-gallery-section/VideoGallerySection.vue';

const props = defineProps<{
  data: HarnessResponseData;
}>();

const heroUrl = computed(
  () => props.data.heroVideoUrl || props.data.heroImageUrl,
);

const galleryItems = computed(() => {
  const items = props.data.galleryItems ?? [];
  const hero = heroUrl.value;
  if (!hero) return items;
  return items.filter((item) => item.imageUrl !== hero);
});

const hasAnyContent = computed(() =>
  Boolean(
    props.data.category ||
    props.data.title ||
    props.data.subtitle ||
    props.data.summary ||
    props.data.keyFindings?.length ||
    props.data.sources?.length ||
    heroUrl.value ||
    props.data.videoGalleryItems?.length ||
    galleryItems.value.length,
  ),
);
</script>

<template>
  <article class="harness-summary">
    <template v-if="hasAnyContent">
      <header class="hero">
        <HeroSection
          :category="data.category"
          :title="data.title"
          :subtitle="data.subtitle"
        />
      </header>

      <ArticleHeroMediaSection
        :hero-video-url="data.heroVideoUrl"
        :hero-video-caption="data.heroVideoCaption"
        :hero-image-url="data.heroImageUrl"
        :hero-image-alt="data.heroImageAlt"
        :hero-caption="data.heroCaption"
      />

      <ParagraphSection title="Summary" :content="data.summary" />
      <KeyFindingsSection title="Key Points" :items="data.keyFindings" />
      <GallerySection :title="data.galleryTitle" :items="galleryItems" />
      <VideoGallerySection
        :title="data.videoGalleryTitle"
        :items="data.videoGalleryItems"
      />
      <SourcesSection :items="data.sources" />
    </template>

    <section v-else class="summary__empty">
      <h3>No results found</h3>
      <p>
        The search did not return any authoritative sources for this request.
      </p>
    </section>
  </article>
</template>

<style scoped>
.harness-summary {
  display: flex;
  flex-direction: column;
  gap: 1.25em;
}

.summary__empty {
  padding: 1.5em;
  border: 1px solid var(--color-divider);
  border-radius: 8px;
  background: var(--color-bg-secondary);
  text-align: center;
}

.summary__empty h3 {
  margin: 0 0 0.5em;
  font-size: 1.1em;
  color: var(--color-fg-primary);
}

.summary__empty p {
  margin: 0;
  color: var(--color-fg-secondary);
  font-size: 0.95em;
}
</style>
