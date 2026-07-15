<script setup lang="ts">
/**
 * Pure image collection: a titled grid of image tiles with dimension badges,
 * source labels, and hover captions. Rendered for the "imagelist" harness
 * template.
 */
import { computed } from 'vue';

import type { HarnessResponseData } from '@/types/harness-response-data.model';

import HeroSection from '../../sections/hero-section/HeroSection.vue';
import SourcesSection from '../../sections/sources-section/SourcesSection.vue';
import ResponseMetaBarPill from '../../shared/ui/response-meta-bar/response-meta-bar-pill/ResponseMetaBarPill.vue';
import ResponseMetaBar from '../../shared/ui/response-meta-bar/ResponseMetaBar.vue';
import ImageListItem from './image-list-item/ImageListItem.vue';

const props = defineProps<{ data: HarnessResponseData }>();

const items = computed(() => props.data.galleryItems ?? []);
const hasContent = computed(
  () => Boolean(props.data.title) || items.value.length > 0,
);
</script>

<template>
  <section v-if="hasContent" class="image-list">
    <header class="image-list__header">
      <ResponseMetaBar>
        <ResponseMetaBarPill v-if="data.category" variant="accent">{{
          data.category
        }}</ResponseMetaBarPill>
        <ResponseMetaBarPill v-if="items.length"
          >{{ items.length }} image{{ items.length === 1 ? '' : 's' }}
        </ResponseMetaBarPill>
      </ResponseMetaBar>
      <HeroSection :title="data.title" :subtitle="data.subtitle" />
    </header>

    <ul v-if="items.length" class="image-list__grid">
      <ImageListItem
        v-for="(item, index) in items"
        :key="`${item.imageUrl}-${index}`"
        :item="item"
      />
    </ul>

    <SourcesSection :items="data.sources" />
  </section>

  <!-- Empty state -->
  <section v-else class="image-list image-list--empty">
    <p>No images found for this request.</p>
  </section>
</template>

<style scoped>
.image-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  width: 100%;
}

.image-list__header {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.image-list__grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-2);
}

.image-list--empty {
  padding: var(--spacing-4);
  border: 1px solid var(--color-divider);
  background-color: var(--color-bg-tertiary);
  text-align: center;
  color: var(--color-fg-muted);
}
</style>
