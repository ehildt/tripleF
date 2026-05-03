<script setup lang="ts">
import { computed, inject, ref } from 'vue';

import type {
  GalleryItem,
  HarnessImageClickedHandler,
} from '@/types/harness-response-data.model';
import { harnessImageClickedKey } from '@/types/harness-response-data.model';

import { toEmbedUrl } from '../../composables/helpers/to-embed-url.helper.js';

const props = defineProps<{
  heroVideoUrl?: string;
  heroVideoCaption?: string;
  heroImageUrl?: string;
  heroImageAlt?: string;
  heroCaption?: string;
  galleryItems?: GalleryItem[];
}>();

const onImageClicked = inject<HarnessImageClickedHandler>(
  harnessImageClickedKey,
);

const hasImageError = ref(false);

const heroItem = computed<GalleryItem | null>(() => {
  if (props.heroVideoUrl) return null;

  const url = props.heroImageUrl || props.galleryItems?.[0]?.imageUrl;
  if (!url) return null;

  return {
    imageUrl: url,
    imageAlt: props.heroImageAlt || props.galleryItems?.[0]?.imageAlt,
    title: props.galleryItems?.[0]?.title,
    caption: props.heroCaption || props.galleryItems?.[0]?.caption,
  };
});

const embedVideoSrc = computed(
  () => toEmbedUrl(props.heroVideoUrl ?? '') ?? '',
);

const encodedSrc = computed(() =>
  heroItem.value ? encodeURI(heroItem.value.imageUrl) : '',
);

const isUnembeddableVideo = computed(
  () => Boolean(props.heroVideoUrl) && !embedVideoSrc.value,
);

function handleClick() {
  if (!heroItem.value) return;
  onImageClicked?.(heroItem.value);
}

function handleImageError() {
  hasImageError.value = true;
}
</script>

<template>
  <figure v-if="heroVideoUrl || heroItem" class="hero-media-card">
    <template v-if="heroVideoUrl">
      <div class="hero-media-card__video">
        <iframe
          v-if="embedVideoSrc"
          :src="embedVideoSrc"
          frameborder="0"
          allowfullscreen
          allow="
            accelerometer;
            autoplay;
            clipboard-write;
            encrypted-media;
            gyroscope;
            picture-in-picture;
            compute-pressure *;
          "
        ></iframe>
        <a
          v-else-if="isUnembeddableVideo"
          :href="heroVideoUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="hero-media-card__fallback"
        >
          Open video
        </a>
      </div>
      <figcaption v-if="heroVideoCaption" class="hero-media-card__caption">
        <p>{{ heroVideoCaption }}</p>
      </figcaption>
    </template>

    <template v-else-if="heroItem">
      <button
        type="button"
        class="harness-gallery__trigger"
        :class="{ 'harness-gallery__trigger--error': hasImageError }"
        :aria-label="`View full size: ${heroItem.imageAlt || 'Image'}`"
        :data-gallery-src="encodedSrc"
        @click.stop="handleClick"
      >
        <img
          :src="encodedSrc"
          :alt="heroItem.imageAlt || ''"
          loading="eager"
          decoding="async"
          fetchpriority="high"
          :class="{ 'harness-gallery__thumb--error': hasImageError }"
          @error="handleImageError"
        />
      </button>
      <figcaption
        v-if="heroItem.title || heroItem.caption"
        class="hero-media-card__caption"
      >
        <strong v-if="heroItem.title && heroItem.title !== heroItem.caption">{{
          heroItem.title
        }}</strong>
        <p v-if="heroItem.caption">{{ heroItem.caption }}</p>
      </figcaption>
    </template>
  </figure>
</template>

<style scoped>
.hero-media-card {
  margin: 0.75em auto 0;
  width: 80%;
  height: 80%;
  display: flex;
  flex-direction: column;
}

.hero-media-card .harness-gallery__trigger {
  all: unset;
  position: relative;
  display: block;
  width: 100%;
  cursor: zoom-in;
  background: var(--color-bg-tertiary);
  aspect-ratio: 16 / 9;
  min-height: 180px;
}

.hero-media-card .harness-gallery__trigger img {
  width: 100%;
  height: 80%;
  object-fit: cover;
  display: block;
  transition: opacity 0.2s ease;
}

.hero-media-card .harness-gallery__trigger--error {
  cursor: default;
}

.hero-media-card .harness-gallery__thumb--error {
  opacity: 0;
}

.hero-media-card .harness-gallery__trigger--error::after {
  content: '⚠ Image unavailable';
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: var(--color-fg-muted);
  font-size: 0.85em;
}

.hero-media-card__video {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  min-height: 320px;
  background: var(--color-bg-tertiary);
}

.hero-media-card__video iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: none;
  display: block;
  overflow: hidden;
}

.hero-media-card__fallback {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-fg-primary);
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s ease;
}

.hero-media-card__fallback:hover {
  color: var(--color-accent-primary);
  text-decoration: underline;
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
