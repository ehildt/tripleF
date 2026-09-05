<script setup lang="ts">
import { computed, inject } from 'vue';

import MediaImageCard from '@/components/shared/media/media-image-card/MediaImageCard.vue';
import type {
  GalleryItem,
  HarnessImageClickedHandler,
  VideoGalleryItem,
} from '@/types/harness-response-data.model';
import { harnessImageClickedKey } from '@/types/harness-response-data.model';

import { buildVideoPosterUrl } from '../../composables/helpers/media/build-video-poster-url.helper';
import { usePlaylistToggle } from '../../composables/use-playlist-toggle';
import MediaCaptionScrim from '../../shared/ui/media-caption-scrim/MediaCaptionScrim.vue';
import MediaCardHeader from '../../shared/ui/media-card-header/MediaCardHeader.vue';
import PlaylistToggleButton from '../../shared/ui/playlist-toggle-button/PlaylistToggleButton.vue';
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
 * never used as a title fallback (the overlay renders it on its own row).
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
      <!-- Caption overlay anchored to the top edge, so the hero video fills
           the whole card. The title + playlist toggle stay pinned to the
           top corner; the caption sits in the row below. -->
      <MediaCaptionScrim edge="top">
        <MediaCardHeader
          :title="heroVideoTitle"
          :url="heroVideoUrl"
          :clamp="2"
          flush
        >
          <template #actions>
            <PlaylistToggleButton
              :active="isInPlaylist"
              @toggle="togglePlaylistVideo"
            />
          </template>
        </MediaCardHeader>
        <p v-if="heroVideoCaption" class="hero-media-card__caption-text">
          {{ heroVideoCaption }}
        </p>
      </MediaCaptionScrim>
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
  /* Match the video list/gallery cards: the media sits on a card backdrop. */
  background-color: var(--color-bg-tertiary);
  align-self: center;
}

/* The hero video matches the height of a lone last-row gallery banner
   (2:1) so the two read as the same size. The header became an overlay, so
   its former height now belongs to the video. */
.hero-media-card :deep(.floating-video-figure .floating-video-figure__media) {
  aspect-ratio: 2 / 1;
}

/* ---------- header row (title + playlist toggle above the video) ---------- */

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

/* Second row of the hero video's top caption overlay: the caption line
   under the title, mirroring the video card's caption text. */
.hero-media-card__caption-text {
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-fg-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
