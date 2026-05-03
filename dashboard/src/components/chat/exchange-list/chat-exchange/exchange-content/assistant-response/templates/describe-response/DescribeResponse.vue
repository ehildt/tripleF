<script setup lang="ts">
import type { HarnessResponseData } from '@/types/harness-response-data.model';

import GallerySection from '../../sections/gallery-section/GallerySection.vue';
import HeroSection from '../../sections/hero-section/HeroSection.vue';
import KeyFindingsSection from '../../sections/key-findings-section/KeyFindingsSection.vue';
import ParagraphSection from '../../sections/paragraph-section/ParagraphSection.vue';
import SourcesSection from '../../sections/sources-section/SourcesSection.vue';

defineProps<{
  data: HarnessResponseData;
}>();
</script>

<template>
  <article class="harness-describe">
    <header class="hero">
      <HeroSection
        :category="data.category"
        :title="data.title"
        :subtitle="data.subtitle"
      />
    </header>
    <GallerySection :items="data.galleryItems" />
    <ParagraphSection title="Description" :content="data.sectionContent" />
    <KeyFindingsSection title="Key Observations" :items="data.keyFindings" />
    <SourcesSection :items="data.sources" />
  </article>
</template>

<style scoped>
.harness-describe {
  display: flex;
  flex-direction: column;
  gap: 1.25em;
}
</style>
