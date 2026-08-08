<script setup lang="ts">
import GallerySection from '../../sections/gallery-section/GallerySection.vue';
import HeroSection from '../../sections/hero-section/HeroSection.vue';
import InternationalCoverageSection from '../../sections/international-coverage-section/InternationalCoverageSection.vue';
import KeyFindingsSection from '../../sections/key-findings-section/KeyFindingsSection.vue';
import PreformattedSection from '../../sections/preformatted-section/PreformattedSection.vue';
import type { OcrResponseProps } from './OcrResponse.types';

defineProps<OcrResponseProps>();
</script>

<template>
  <article class="harness-ocr">
    <header class="hero">
      <HeroSection :title="data.title" :subtitle="data.subtitle" />
    </header>
    <GallerySection :title="data.galleryTitle" :items="data.galleryItems" />
    <PreformattedSection
      :title="$t('common.extractedText')"
      :content="data.sectionContent"
    />
    <KeyFindingsSection
      :items="data.keyFindings"
      :title="$t('common.keyFindings')"
    />
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
