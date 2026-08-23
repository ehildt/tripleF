<script setup lang="ts">
/**
 * The hero region shared by the snippet templates (news, article,
 * evaluation, summary, merge): the title/subtitle header plus the hero media
 * (video or image), stacked by default or side-by-side in the split
 * direction (ar2). The `#lead` slot renders into the text stack in split
 * mode only — in stacked mode each template places its lead/body itself.
 */
import ArticleHeroMediaSection from '../../../sections/article-hero-media-section/ArticleHeroMediaSection.vue';
import HeroStack from '../../../sections/hero-stack/HeroStack.vue';
import ResponseHeader from '../response-header/ResponseHeader.vue';
import type { ArticleHeroProps } from './ArticleHero.types';

defineProps<ArticleHeroProps>();
</script>

<template>
  <header v-if="split" class="article-hero article-hero--split">
    <ArticleHeroMediaSection
      :hero-video-url="heroVideoUrl"
      :hero-video-caption="heroVideoCaption"
      :hero-video-title="heroVideoTitle"
      :hero-image-url="heroImageUrl"
      :hero-image-alt="heroImageAlt"
      :hero-caption="heroCaption"
    />
    <HeroStack>
      <ResponseHeader :title="title" :subtitle="subtitle" panel />
      <slot name="lead" />
    </HeroStack>
  </header>
  <header v-else class="article-hero">
    <ResponseHeader :title="title" :subtitle="subtitle" panel />
    <ArticleHeroMediaSection
      :hero-video-url="heroVideoUrl"
      :hero-video-caption="heroVideoCaption"
      :hero-video-title="heroVideoTitle"
      :hero-image-url="heroImageUrl"
      :hero-image-alt="heroImageAlt"
      :hero-caption="heroCaption"
    />
  </header>
</template>

<style scoped>
/* Split direction (ar2): the hero media panel sits beside the title stack.
   Below 720px it falls back to a single column. The media card keeps its own
   top margin in stacked mode (0.75em); in split mode the grid gap owns the
   spacing, so the margin is removed. */
.article-hero--split {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25em;
}

@media (min-width: 720px) {
  .article-hero--split {
    grid-template-columns: 1fr 1fr;
    align-items: start;
  }

  .article-hero--split :deep(.hero-media-card) {
    margin-top: 0;
  }
}
</style>
