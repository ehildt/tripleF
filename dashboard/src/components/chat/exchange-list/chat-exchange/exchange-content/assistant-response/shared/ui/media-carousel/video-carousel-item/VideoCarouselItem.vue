<script setup lang="ts">
import { ListMinus, ListPlus } from '@lucide/vue';
import { computed } from 'vue';

import Tooltip from '@/components/shared/ui/tooltip/Tooltip.vue';
import type { VideoGalleryItem } from '@/types/harness-response-data.model';

import { buildVideoPosterUrl } from '../../../../composables/helpers/media/build-video-poster-url.helper';
import { usePlaylistToggle } from '../../../../composables/use-playlist-toggle';
import FloatingVideoFigure from '../../../../sections/floating-video-figure/FloatingVideoFigure.vue';

const props = defineProps<{
  item: VideoGalleryItem;
  /** Whether this slide is the centered one — only then does the floating
   * player dock to it; side slides keep the video popped out. */
  active?: boolean;
}>();

const posterUrl = computed(
  () => props.item.thumbnailUrl || buildVideoPosterUrl(props.item.videoUrl),
);

const { isInPlaylist, togglePlaylistVideo } = usePlaylistToggle(
  () => props.item,
);

const playlistToggleTitle = computed(() =>
  isInPlaylist.value ? 'Remove from playlist' : 'Add to playlist',
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
      <div class="video-carousel-item__caption">
        <div class="video-carousel-item__row">
          <a
            v-if="item.title"
            :href="item.videoUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="video-carousel-item__title"
            >{{ item.title }}</a
          >
        </div>
        <div class="video-carousel-item__caption-row">
          <p v-if="item.caption" class="video-carousel-item__caption-text">
            {{ item.caption }}
          </p>
          <Tooltip :text="playlistToggleTitle">
            <button
              type="button"
              class="video-carousel-item__playlist-toggle"
              :class="{
                'video-carousel-item__playlist-toggle--added': isInPlaylist,
              }"
              :aria-label="playlistToggleTitle"
              :aria-pressed="isInPlaylist"
              @click.stop="togglePlaylistVideo"
            >
              <ListMinus
                v-if="isInPlaylist"
                class="video-carousel-item__playlist-toggle-icon"
              />
              <ListPlus
                v-else
                class="video-carousel-item__playlist-toggle-icon"
              />
            </button>
          </Tooltip>
        </div>
      </div>
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
  transform: scale(0.9);
  opacity: 0.55;
  filter: brightness(0.85) grayscale(0.75) blur(2px);
  transition:
    transform 0.35s ease,
    opacity 0.35s ease,
    filter 0.35s ease;
}

.video-carousel-item--active .video-carousel-item__media {
  transform: scale(1);
  opacity: 1;
  filter: brightness(1) grayscale(0) blur(0);
}

.video-carousel-item--prev .video-carousel-item__media,
.video-carousel-item--next .video-carousel-item__media {
  transform: scale(0.9);
  opacity: 0.55;
  filter: brightness(0.85) grayscale(0.75) blur(2px);
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

/* -------- caption bar (overlays the media's bottom, full width) -------- */

.video-carousel-item__caption {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  padding: var(--spacing-1-5) var(--spacing-2);
  background: color-mix(in srgb, var(--color-bg-primary) 88%, transparent);
  opacity: 0.85;
}

.video-carousel-item__row {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  min-width: 0;
}

.video-carousel-item__title {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.3;
  color: var(--color-fg-primary);
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.video-carousel-item__title:hover {
  color: var(--color-accent-primary);
}

.video-carousel-item__caption-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
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

/* -------- playlist toggle (quiet nav-style icon at the row's right) -------- */

.video-carousel-item__playlist-toggle {
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

.video-carousel-item__playlist-toggle:hover {
  color: var(--color-fg-primary);
}

.video-carousel-item__playlist-toggle--added,
.video-carousel-item__playlist-toggle--added:hover {
  color: var(--color-accent-primary);
}

.video-carousel-item__playlist-toggle:focus-visible {
  outline: 1px solid var(--color-accent-primary);
  outline-offset: -1px;
}

.video-carousel-item__playlist-toggle-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
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
