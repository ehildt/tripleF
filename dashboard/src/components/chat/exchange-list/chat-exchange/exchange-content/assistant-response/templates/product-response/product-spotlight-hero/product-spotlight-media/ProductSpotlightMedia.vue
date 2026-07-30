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
  title: props.videoTitle || props.videoCaption,
  caption: props.videoCaption,
}));

const { isInPlaylist, togglePlaylistVideo } = usePlaylistToggle(heroVideoItem);

/** Caption strip mirrors the video gallery card: bold title, muted caption. */
const captionTitle = computed(() =>
  hasHeroVideo.value ? props.videoTitle : undefined,
);
const captionText = computed(() =>
  hasHeroVideo.value ? props.videoCaption : props.imageCaption,
);
const showCaption = computed(
  () => Boolean(captionTitle.value) || Boolean(captionText.value),
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
    <div class="spotlight__box">
      <FloatingVideoFigure
        v-if="hasHeroVideo"
        :video-url="videoUrl!"
        :title="videoTitle || videoCaption"
        :poster-url="videoPosterUrl"
      />
      <button
        v-if="hasHeroVideo"
        type="button"
        class="spotlight__playlist-toggle"
        :class="{ 'spotlight__playlist-toggle--added': isInPlaylist }"
        :title="isInPlaylist ? 'Remove from playlist' : 'Add to playlist'"
        :aria-pressed="isInPlaylist"
        @click.stop="handleToggle"
      >
        <ListCheck
          v-if="isInPlaylist"
          class="spotlight__playlist-toggle-icon"
        />
        <ListPlus v-else class="spotlight__playlist-toggle-icon" />
      </button>
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

    <figcaption v-if="showCaption" class="spotlight__caption">
      <strong v-if="captionTitle && captionTitle !== captionText">
        {{ captionTitle }}
      </strong>
      <p v-if="captionText">{{ captionText }}</p>
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

.spotlight__playlist-toggle {
  position: absolute;
  top: var(--spacing-1);
  right: var(--spacing-1);
  margin: 0.1rem 0.1rem 0 0;
  z-index: 3;
  display: grid;
  place-items: center;
  width: 1.5rem;
  height: 1.5rem;
  color: white;
  cursor: pointer;
  background: color-mix(in srgb, black 55%, transparent);
  backdrop-filter: blur(12px) saturate(1.5);
  -webkit-backdrop-filter: blur(12px) saturate(1.5);
  box-shadow:
    0 0.3rem 1rem color-mix(in srgb, black 45%, transparent),
    inset 0 0 0 1px color-mix(in srgb, white 12%, transparent);
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease;
}

.spotlight__playlist-toggle:hover {
  color: white;
  background: var(--color-accent-primary);
}

.spotlight__playlist-toggle--added {
  color: white;
  background: color-mix(in srgb, var(--color-accent-primary) 85%, transparent);
}

.spotlight__playlist-toggle-icon {
  filter: drop-shadow(0 1px 2px color-mix(in srgb, black 60%, transparent));
  width: 0.9rem;
  height: 0.9rem;
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

.spotlight__caption strong {
  display: block;
  color: var(--color-fg-primary);
  margin-bottom: 0.25em;
}

.spotlight__caption p {
  margin: 0;
}
</style>
