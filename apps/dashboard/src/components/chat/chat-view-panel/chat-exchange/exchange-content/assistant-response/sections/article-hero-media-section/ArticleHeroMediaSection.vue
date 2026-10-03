<script setup lang="ts">
import { computed } from 'vue';

import FloatingVideoFigure from '@/components/chat/shared/ui/floating-video-figure/FloatingVideoFigure.vue';
import MediaCaptionScrim from '@/components/chat/shared/ui/media-caption-scrim/MediaCaptionScrim.vue';
import MediaCardHeader from '@/components/chat/shared/ui/media-card-header/MediaCardHeader.vue';
import MediaImageCard from '@/components/shared/media/media-image-card/MediaImageCard.vue';
import PlaylistToggleButton from '@/components/shared/ui/playlist-toggle-button/PlaylistToggleButton.vue';
import { usePlaylistToggle } from '@/composables/use-playlist-toggle';
import { buildVideoPosterUrl } from '@/stores/helpers/harness/media/build-video-poster-url.helper';
import type {
  GalleryItem,
  VideoGalleryItem,
} from '@/types/harness-response-data.model';

const props = defineProps<{
  heroVideoUrl?: string;
  heroVideoCaption?: string;
  heroVideoTitle?: string;
  heroImageUrl?: string;
  heroImageAlt?: string;
  heroCaption?: string;
  galleryItems?: GalleryItem[];
  /** Opens the owning surface's lightbox for a clicked hero image. */
  onImageClick?: (item: GalleryItem) => void;
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
  props.onImageClick?.(heroItem.value);
}
</script>

<template>
  <!-- Plain div (not a figure), exactly like the video gallery cards: the
       media figure inside must never nest inside another figure. -->
  <div v-if="heroVideoUrl || heroItem" class="hero-media-card">
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
      <!-- The hero-media-card__video class lands on the figure's root
           element and carries the layout constraints below, exactly like
           video-gallery__video on the video list items. -->
      <FloatingVideoFigure
        class="hero-media-card__video"
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
      <div
        v-if="heroItem.title || heroItem.caption"
        class="hero-media-card__caption"
      >
        <strong v-if="heroItem.title && heroItem.title !== heroItem.caption">
          {{ heroItem.title }}
        </strong>
        <p v-if="heroItem.caption">{{ heroItem.caption }}</p>
      </div>
    </template>
  </div>
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

/* Layout constraints for the FloatingVideoFigure root (class fallthrough),
   exactly like the video gallery items: the hero's 2:1 frame lives on the
   figure root — wider than the standard 3:2 video frame (a cinematic
   strip). The header is an overlay, so its former height belongs to the
   video. No deep override of the media box inside. */
.hero-media-card__video {
  position: relative;
  width: 100%;
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
