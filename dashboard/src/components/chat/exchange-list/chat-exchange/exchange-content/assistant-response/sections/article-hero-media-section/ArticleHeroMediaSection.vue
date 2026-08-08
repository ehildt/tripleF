<script setup lang="ts">
import { ListMinus, ListPlus } from '@lucide/vue';
import { computed, inject } from 'vue';

import MediaImageCard from '@/components/shared/media/MediaImageCard.vue';
import Tooltip from '@/components/shared/ui/tooltip/Tooltip.vue';
import type {
  GalleryItem,
  HarnessImageClickedHandler,
  VideoGalleryItem,
} from '@/types/harness-response-data.model';
import { harnessImageClickedKey } from '@/types/harness-response-data.model';

import { buildVideoPosterUrl } from '../../composables/helpers/media/build-video-poster-url.helper';
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
 * The hero video as a playlist entry: the real title only — the caption is
 * never used as a title fallback (the figcaption below renders it on its
 * own, behind a v-if).
 */
const heroVideoItem = computed<VideoGalleryItem>(() => ({
  videoUrl: props.heroVideoUrl ?? '',
  title: props.heroVideoTitle,
  caption: props.heroVideoCaption,
}));

const { isInPlaylist, togglePlaylistVideo } = usePlaylistToggle(heroVideoItem);

const onImageClicked = inject<HarnessImageClickedHandler>(
  harnessImageClickedKey,
  () => undefined,
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
      <!-- Header row: hero video title linking to the source, and the
           playlist toggle as a quiet nav-style icon button on the right. -->
      <div class="hero-media-card__header">
        <a
          v-if="heroVideoTitle"
          :href="heroVideoUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="hero-media-card__title"
          >{{ heroVideoTitle }}</a
        >
        <Tooltip
          :text="isInPlaylist ? 'Remove from playlist' : 'Add to playlist'"
        >
          <button
            type="button"
            class="hero-media-card__playlist-toggle"
            :class="{
              'hero-media-card__playlist-toggle--added': isInPlaylist,
            }"
            :aria-label="
              isInPlaylist ? 'Remove from playlist' : 'Add to playlist'
            "
            :aria-pressed="isInPlaylist"
            @click.stop="togglePlaylistVideo"
          >
            <ListMinus
              v-if="isInPlaylist"
              class="hero-media-card__playlist-toggle-icon"
            />
            <ListPlus v-else class="hero-media-card__playlist-toggle-icon" />
          </button>
        </Tooltip>
      </div>
      <FloatingVideoFigure
        :video-url="heroVideoUrl"
        :title="heroVideoTitle"
        :poster-url="heroPosterUrl"
      />
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
  width: 100%;
  /* Match the video list/gallery cards: the header row and media sit on a
     card backdrop, so the header doesn't float on the bare exchange bg. */
  background: var(--color-bg-tertiary);
}

/* The hero video matches the height of a lone last-row gallery banner
   (16:7) so the two read as the same size. */
.hero-media-card :deep(.floating-video-figure .floating-video-figure__media) {
  aspect-ratio: 16 / 7;
}

/* ---------- header row (title + playlist toggle above the video) ---------- */

.hero-media-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-2);
  padding: 0.5rem;
}

.hero-media-card__title {
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

.hero-media-card__title:hover {
  color: var(--color-accent-primary);
}

/* ---------- playlist toggle (quiet nav-style icon in the header) ---------- */

.hero-media-card__playlist-toggle {
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

.hero-media-card__playlist-toggle:hover {
  color: var(--color-fg-primary);
}

.hero-media-card__playlist-toggle--added,
.hero-media-card__playlist-toggle--added:hover {
  color: var(--color-accent-primary);
}

.hero-media-card__playlist-toggle:focus {
  outline: none;
}

.hero-media-card__playlist-toggle:focus-visible {
  outline: 1px solid var(--color-accent-primary);
  outline-offset: -1px;
}

.hero-media-card__playlist-toggle-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
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
