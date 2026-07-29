<script setup lang="ts">
import { ListCheck, ListPlus } from '@lucide/vue';
import { computed, inject } from 'vue';

import MediaImageCard from '@/components/shared/media/MediaImageCard.vue';
import type {
  GalleryItem,
  HarnessImageClickedHandler,
  VideoGalleryItem,
} from '@/types/harness-response-data.model';
import { harnessImageClickedKey } from '@/types/harness-response-data.model';

import { buildVideoPosterUrl } from '../../composables/helpers/build-video-poster-url.helper';
import { usePlaylistToggle } from '../../composables/use-playlist-toggle';
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

/**
 * The hero video as a playlist entry: title falls back to the caption, so a
 * title-less hero still names itself in the playlist panel.
 */
const heroVideoItem = computed<VideoGalleryItem>(() => ({
  videoUrl: props.heroVideoUrl ?? '',
  title: props.heroVideoTitle || props.heroVideoCaption,
  caption: props.heroVideoCaption,
}));

const { isInPlaylist, togglePlaylistVideo } = usePlaylistToggle(heroVideoItem);

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
      <!-- Playlist toggle in the card's top-right corner -->
      <button
        type="button"
        class="hero-media-card__playlist-toggle"
        :class="{ 'hero-media-card__playlist-toggle--added': isInPlaylist }"
        :title="isInPlaylist ? 'Remove from playlist' : 'Add to playlist'"
        :aria-pressed="isInPlaylist"
        @click.stop="togglePlaylistVideo"
      >
        <ListCheck
          v-if="isInPlaylist"
          class="hero-media-card__playlist-toggle-icon"
        />
        <ListPlus v-else class="hero-media-card__playlist-toggle-icon" />
      </button>
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
  position: relative;
  margin: 0.75em auto 0;
  width: 80%;
}

/* ---------- playlist toggle (top-right corner) ---------- */

.hero-media-card__playlist-toggle {
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

.hero-media-card__playlist-toggle:hover {
  color: white;
  background: var(--color-accent-primary);
}

.hero-media-card__playlist-toggle--added {
  color: white;
  background: color-mix(in srgb, var(--color-accent-primary) 85%, transparent);
}

.hero-media-card__playlist-toggle-icon {
  filter: drop-shadow(0 1px 2px color-mix(in srgb, black 60%, transparent));
  width: 0.9rem;
  height: 0.9rem;
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
