<script setup lang="ts">
import type { VideoGalleryItem } from '@/types/harness-response-data.model';

import FloatingVideoFigure from '../../../../sections/floating-video-figure/FloatingVideoFigure.vue';
import { useVideoGalleryTile } from '../../../../shared/composables/use-video-gallery-tile.composable';
import MediaCaptionScrim from '../../media-caption-scrim/MediaCaptionScrim.vue';
import MediaCardHeader from '../../media-card-header/MediaCardHeader.vue';
import PlaylistToggleButton from '../../playlist-toggle-button/PlaylistToggleButton.vue';

const props = defineProps<{
  item: VideoGalleryItem;
  /** Whether this slide is the centered one — only then does the floating
   * player dock to it; side slides keep the video popped out. */
  active?: boolean;
}>();

const { posterUrl, isInPlaylist, togglePlaylistVideo } = useVideoGalleryTile(
  () => props.item,
);
</script>

<template>
  <li class="video-carousel-item">
    <!-- The media box bleeds into the track's peek padding exactly like the
         image slides, so side slides read as dimmed neighbors at the edges.
         The caption bar sits inside the media box, so it spans the same
         full width as the video. -->
    <div class="video-carousel-item__media">
      <FloatingVideoFigure
        class="video-carousel-item__figure"
        :video-url="item.videoUrl"
        :title="item.title"
        :poster-url="posterUrl"
        :dockable="active"
      />
      <MediaCaptionScrim
        class="video-carousel-item__caption"
        :class="{ 'video-carousel-item__caption--no-caption': !item.caption }"
      >
        <!-- Header row: the title linking to its source. Without a caption
             line the add-to button joins the actions column here and the
             row pins to the bar's bottom edge via the modifier class. -->
        <MediaCardHeader :title="item.title" :url="item.videoUrl" flush>
          <template #actions>
            <PlaylistToggleButton
              v-if="!item.caption"
              :active="isInPlaylist"
              @toggle="togglePlaylistVideo"
            />
          </template>
        </MediaCardHeader>
        <!-- Caption line with the add-to button on its right; the row only
             renders when the slide carries a caption. -->
        <div v-if="item.caption" class="video-carousel-item__caption-row">
          <p class="video-carousel-item__caption-text">{{ item.caption }}</p>
          <PlaylistToggleButton
            :active="isInPlaylist"
            @toggle="togglePlaylistVideo"
          />
        </div>
      </MediaCaptionScrim>
    </div>
  </li>
</template>

<style scoped>
.video-carousel-item {
  position: relative;
  display: flex;
  min-width: 0;
}

/* -------- peek media box (mirrors the image slides) -------- */

.video-carousel-item__media {
  position: absolute;
  left: -25%;
  right: -25%;
  top: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform: var(--carousel-peek-transform, scale(0.9));
  opacity: var(--carousel-peek-opacity, 0.55);
  filter: var(
    --carousel-peek-filter,
    brightness(0.85) grayscale(0.75) blur(2px)
  );
  transition:
    transform 0.35s ease,
    opacity 0.35s ease,
    filter 0.35s ease;
}

.video-carousel-item--active .video-carousel-item__media {
  transform: var(--carousel-active-transform, scale(1));
  opacity: var(--carousel-active-opacity, 1);
  filter: var(--carousel-active-filter, brightness(1) grayscale(0) blur(0));
}

.video-carousel-item--prev .video-carousel-item__media,
.video-carousel-item--next .video-carousel-item__media {
  transform: var(--carousel-peek-transform, scale(0.9));
  opacity: var(--carousel-peek-opacity, 0.55);
  filter: var(
    --carousel-peek-filter,
    brightness(0.85) grayscale(0.75) blur(2px)
  );
}

/* The figure fills the media box above the caption bar; the poster crops
   to the wide peek box instead of stretching. */
.video-carousel-item__figure {
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
}

.video-carousel-item__media :deep(.floating-video-figure__media) {
  height: 100%;
  aspect-ratio: auto;
}

.video-carousel-item__media :deep(.floating-video-figure__poster-image),
.video-carousel-item__media :deep(.floating-video-figure__placeholder-image) {
  object-fit: cover;
}

/* -------- caption bar (scrim overlay styles live in MediaCaptionScrim) -------- */

.video-carousel-item__caption {
  /* Reserve the header row plus one caption line: the bar keeps its height
     whether or not the slide carries a caption, so the add-to button stays
     anchored and slides never shift. */
  min-height: 4.5rem;
}

/* No caption line: the header row (title + add-to) pins to the bar's
   bottom edge, so the add-to button sits flush at the video's
   bottom-right. */
.video-carousel-item__caption--no-caption {
  justify-content: flex-end;
}

.video-carousel-item__caption-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 0;
}

.video-carousel-item__caption-text {
  flex: 1 1 auto;
  min-width: 0;
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-fg-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* -------- play affordance (centered slide only) --------
   The dimmed side slides read as background context, like the image
   carousel's side images: their play icons are hidden and their videos are
   not clickable — only the centered slide's video can be engaged. The list
   presentation never carries these slide classes, so its posters stay
   clickable. */

.video-carousel-item :deep(.floating-video-figure__poster-play) {
  display: none;
}

.video-carousel-item--active :deep(.floating-video-figure__poster-play) {
  display: grid;
}

.video-carousel-item :deep(.floating-video-figure) {
  pointer-events: none;
}

.video-carousel-item--active :deep(.floating-video-figure) {
  pointer-events: auto;
}
</style>
