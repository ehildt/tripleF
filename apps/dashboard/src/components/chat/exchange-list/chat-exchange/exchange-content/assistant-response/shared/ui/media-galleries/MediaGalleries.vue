<script setup lang="ts">
/**
 * The media pair shared by the snippet templates (news, article,
 * evaluation, summary, merge): the video gallery and the image gallery in
 * the app-level order (videos first or images first, via the template's
 * composable). Both sections self-hide when their items are absent, so this
 * fragment simply orders them — no wrapper box, so the parent's flex gap
 * keeps spacing the sections exactly as before.
 */
import GallerySection from '../../../sections/gallery-section/GallerySection.vue';
import VideoGallerySection from '../../../sections/video-gallery-section/VideoGallerySection.vue';
import type { MediaGalleriesProps } from './MediaGalleries.types';

defineProps<MediaGalleriesProps>();
</script>

<template>
  <template v-if="videosFirst">
    <VideoGallerySection
      :title="videoGalleryTitle"
      :items="videoGalleryItems"
    />
    <GallerySection
      :title="galleryTitle"
      :items="galleryItems"
      :mosaic="mosaic"
    />
  </template>
  <template v-else>
    <GallerySection
      :title="galleryTitle"
      :items="galleryItems"
      :mosaic="mosaic"
    />
    <VideoGallerySection
      :title="videoGalleryTitle"
      :items="videoGalleryItems"
    />
  </template>
</template>
