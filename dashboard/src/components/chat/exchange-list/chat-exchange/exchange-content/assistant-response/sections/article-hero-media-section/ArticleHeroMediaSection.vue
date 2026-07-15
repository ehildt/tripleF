<script setup lang="ts">
import { computed, inject } from 'vue';

import MediaImageCard from '@/components/shared/media/MediaImageCard.vue';
import type {
  GalleryItem,
  HarnessImageClickedHandler,
} from '@/types/harness-response-data.model';
import { harnessImageClickedKey } from '@/types/harness-response-data.model';

import { buildVideoPosterUrl } from '../../composables/helpers/build-video-poster-url.helper';
import FloatingVideoFigure from '../floating-video-figure/FloatingVideoFigure.vue';

const props = defineProps<{
  heroVideoUrl?: string;
  heroVideoCaption?: string;
  heroVideoTitle?: string;
  heroImageUrl?: string;
  heroImageAlt?: string;
  heroCaption?: string;
  galleryItems?: GalleryItem[];
}>();

const heroPosterUrl = computed(() =>
  props.heroVideoUrl ? buildVideoPosterUrl(props.heroVideoUrl) : null,
);

const onImageClicked = inject<HarnessImageClickedHandler>(
  harnessImageClickedKey,
);

const heroItem = computed(() => {
  if (props.heroVideoUrl) return null;

  const url = props.heroImageUrl || props.galleryItems?.[0]?.imageUrl;
  if (!url) return null;

  return {
    imageUrl: encodeURI(url),
    imageAlt: props.heroImageAlt || props.galleryItems?.[0]?.imageAlt,
    title: props.galleryItems?.[0]?.title,
    caption: props.heroCaption || props.galleryItems?.[0]?.caption,
  };
});

function handleClick() {
  if (!heroItem.value) return;
  onImageClicked?.(heroItem.value);
}
</script>

<template>
  <figure v-if="heroVideoUrl || heroItem" class="hero-media-card">
    <template v-if="heroVideoUrl">
      <FloatingVideoFigure
        :video-url="heroVideoUrl"
        :title="heroVideoTitle || heroVideoCaption"
        :poster-url="heroPosterUrl"
      />
      <figcaption v-if="heroVideoCaption" class="hero-media-card__caption">
        <p>{{ heroVideoCaption }}</p>
      </figcaption>
    </template>

    <template v-else-if="heroItem">
      <MediaImageCard
        :image-url="heroItem.imageUrl!"
        :image-alt="heroItem.imageAlt || ''"
        @click="handleClick"
      />
      <figcaption
        v-if="heroItem.title || heroItem.caption"
        class="hero-media-card__caption"
      >
        <strong v-if="heroItem.title && heroItem.title !== heroItem.caption">
          {{ heroItem.title }}
        </strong>
        <p v-if="heroItem.caption">{{ heroItem.caption }}</p>
      </figcaption>
    </template>
  </figure>
</template>

<style scoped>
.hero-media-card {
  margin: 0.75em auto 0;
  width: 80%;
}

.hero-media-card__caption {
  padding: var(--spacing-1-5) var(--spacing-2);
  font-size: 0.85em;
  color: var(--color-fg-muted);
  border-top: 1px solid var(--color-divider);
}

.hero-media-card__caption strong {
  display: block;
  color: var(--color-fg-primary);
  margin-bottom: 0.25em;
}

.hero-media-card__caption p {
  margin: 0 0 0.5em;
}
</style>
