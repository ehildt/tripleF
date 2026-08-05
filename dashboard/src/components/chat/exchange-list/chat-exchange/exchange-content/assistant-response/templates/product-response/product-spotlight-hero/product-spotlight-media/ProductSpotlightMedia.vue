<script setup lang="ts">
/**
 * Main media area of the product spotlight: a hero video (handled by the
 * shared floating-video figure) or a clickable hero image that opens the
 * lightbox — framed in the same card chrome our other video surfaces use
 * (hairline border plus a caption strip), including the playlist
 * add/remove toggle.
 */
import { ListCheck, ListPlus } from '@lucide/vue';
import { computed } from 'vue';

import type {
  GalleryItem,
  VideoGalleryItem,
} from '@/types/harness-response-data.model';

import { buildVideoPosterUrl } from '../../../../composables/helpers/build-video-poster-url.helper';
import { usePlaylistToggle } from '../../../../composables/use-playlist-toggle';
import FloatingVideoFigure from '../../../../sections/floating-video-figure/FloatingVideoFigure.vue';

const props = defineProps<{
  videoUrl?: string;
  videoTitle?: string;
  videoCaption?: string;
  /** Used as the ultimate alt/aria-label fallback for the hero image. */
  title?: string;
  selectedSlide?: GalleryItem;
  imageCaption?: string;
}>();

const emit = defineEmits<{
  (e: 'togglePlaylist'): void;
  (e: 'imageClicked', slide: GalleryItem): void;
}>();

const hasHeroVideo = computed(() => Boolean(props.videoUrl));

const videoPosterUrl = computed(() =>
  props.videoUrl ? buildVideoPosterUrl(props.videoUrl) : null,
);

const heroVideoItem = computed<VideoGalleryItem>(() => ({
  videoUrl: props.videoUrl ?? '',
  title: props.videoTitle,
  caption: props.videoCaption,
}));

const { isInPlaylist, togglePlaylistVideo } = usePlaylistToggle(heroVideoItem);

/** Caption strip mirrors the video gallery card: muted caption below the
 * header title. */
const captionTitle = computed(() =>
  hasHeroVideo.value ? props.videoTitle : undefined,
);
const captionText = computed(() =>
  hasHeroVideo.value ? props.videoCaption : props.imageCaption,
);

function handleToggle() {
  togglePlaylistVideo();
  emit('togglePlaylist');
}

function openLightbox() {
  if (props.selectedSlide) {
    emit('imageClicked', props.selectedSlide);
  }
}
</script>

<template>
  <figure
    class="spotlight__media"
    :class="{ 'spotlight__media--video': hasHeroVideo }"
  >
    <!-- Header row (video only): title linking to the source, and the
         playlist toggle as a quiet nav-style icon button on the right. -->
    <div v-if="hasHeroVideo" class="spotlight__header">
      <a
        v-if="captionTitle"
        :href="videoUrl!"
        target="_blank"
        rel="noopener noreferrer"
        class="spotlight__title"
        >{{ captionTitle }}</a
      >
      <button
        type="button"
        class="spotlight__playlist-toggle"
        :class="{ 'spotlight__playlist-toggle--added': isInPlaylist }"
        :title="isInPlaylist ? 'Remove from playlist' : 'Add to playlist'"
        :aria-label="isInPlaylist ? 'Remove from playlist' : 'Add to playlist'"
        :aria-pressed="isInPlaylist"
        @click.stop="handleToggle"
      >
        <ListCheck
          v-if="isInPlaylist"
          class="spotlight__playlist-toggle-icon"
        />
        <ListPlus v-else class="spotlight__playlist-toggle-icon" />
      </button>
    </div>

    <div class="spotlight__box">
      <FloatingVideoFigure
        v-if="hasHeroVideo"
        :video-url="videoUrl!"
        :title="videoTitle"
        :poster-url="videoPosterUrl"
      />
      <button
        v-else-if="selectedSlide"
        type="button"
        class="spotlight__trigger"
        :aria-label="`View full size: ${selectedSlide.imageAlt || title || 'Product image'}`"
        @click="openLightbox"
      >
        <img
          :src="selectedSlide.imageUrl"
          :alt="selectedSlide.imageAlt || title || 'Product image'"
          class="spotlight__img"
          loading="lazy"
        />
      </button>
      <div v-else class="spotlight__placeholder">
        <span>NO IMAGE</span>
      </div>
    </div>

    <figcaption v-if="captionText" class="spotlight__caption">
      <p>{{ captionText }}</p>
    </figcaption>
  </figure>
</template>

<style scoped>
/* The card chrome matches the video gallery card: hairline border around a
   media box plus a caption strip below it. */
.spotlight__media {
  position: relative;
  display: flex;
  flex-direction: column;
  margin: 0;
  width: 100%;
  overflow: hidden;
  border: 1px solid var(--color-divider);
  background: var(--color-bg-secondary);
}

.spotlight__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-2);
  padding: 0.5rem;
}

.spotlight__title {
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.3;
  color: var(--color-fg-primary);
  text-decoration: none;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.spotlight__title:hover {
  color: var(--color-accent-primary);
}

.spotlight__box {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  width: 100%;
  aspect-ratio: 4 / 3;
  background-color: var(--color-bg-tertiary);
}

.spotlight__media--video .spotlight__box {
  aspect-ratio: 16 / 9;
}

/* ---------- playlist toggle (quiet nav-style icon in the header) ---------- */

.spotlight__playlist-toggle {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 1.75rem;
  height: 1.75rem;
  border: none;
  background-color: transparent;
  color: var(--color-fg-muted);
  cursor: pointer;
  transition: color 0.2s ease;
}

.spotlight__playlist-toggle:hover {
  color: var(--color-fg-primary);
}

.spotlight__playlist-toggle--added,
.spotlight__playlist-toggle--added:hover {
  color: var(--color-accent-primary);
}

.spotlight__playlist-toggle:focus {
  outline: none;
}

.spotlight__playlist-toggle:focus-visible {
  outline: 1px solid var(--color-accent-primary);
  outline-offset: -1px;
}

.spotlight__playlist-toggle-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.spotlight__trigger {
  all: unset;
  display: block;
  width: 100%;
  height: 100%;
  cursor: zoom-in;
}

.spotlight__trigger:focus-visible {
  outline: 2px solid var(--color-accent-primary);
  outline-offset: -2px;
}

.spotlight__img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.spotlight__placeholder {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  font-size: 0.7rem;
  font-family: var(--font-mono);
  letter-spacing: 0.1em;
  color: var(--color-fg-muted);
}

/* Caption strip mirrors hero-media-card / video-gallery caption. */
.spotlight__caption {
  padding: var(--spacing-1-5) var(--spacing-2);
  font-size: 0.85rem;
  color: var(--color-fg-muted);
  border-top: 1px solid var(--color-divider);
}

.spotlight__caption p {
  margin: 0;
}
</style>
