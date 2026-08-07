<script setup lang="ts">
import type { HarnessResponseData } from '@/types/harness-response-data.model';

import GallerySection from '../../sections/gallery-section/GallerySection.vue';
import HeroSection from '../../sections/hero-section/HeroSection.vue';
import InternationalCoverageSection from '../../sections/international-coverage-section/InternationalCoverageSection.vue';
import KeyFindingsSection from '../../sections/key-findings-section/KeyFindingsSection.vue';
import PreformattedSection from '../../sections/preformatted-section/PreformattedSection.vue';

defineProps<{
  data: HarnessResponseData;
}>();
</script>

<template>
  <article class="harness-ocr">
    <header class="hero">
      <HeroSection :title="data.title" :subtitle="data.subtitle" />
    </header>
    <GallerySection :items="data.galleryItems" />
    <PreformattedSection
      title="Extracted Text"
      :content="data.sectionContent"
    />
    <KeyFindingsSection title="Observations" :items="data.keyFindings" />
    <InternationalCoverageSection :items="data.internationalCoverage" />
  </article>
</template>

<style scoped>
.harness-ocr {
  display: flex;
  flex-direction: column;
  gap: 1.25em;
}
</style>
