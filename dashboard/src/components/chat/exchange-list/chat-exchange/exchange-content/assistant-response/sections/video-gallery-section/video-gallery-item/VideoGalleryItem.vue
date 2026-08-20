<script setup lang="ts">
import { Info } from '@lucide/vue';

import IconButton from '@/components/shared/ui/icon-button/IconButton.vue';
import type { VideoGalleryItem } from '@/types/harness-response-data.model';

import { useVideoGalleryTile } from '../../../shared/composables/use-video-gallery-tile.composable';
import MediaCaptionScrim from '../../../shared/ui/media-caption-scrim/MediaCaptionScrim.vue';
import MediaCardHeader from '../../../shared/ui/media-card-header/MediaCardHeader.vue';
import PlaylistToggleButton from '../../../shared/ui/playlist-toggle-button/PlaylistToggleButton.vue';
import FloatingVideoFigure from '../../floating-video-figure/FloatingVideoFigure.vue';

const props = defineProps<{
  item: VideoGalleryItem;
}>();

const { posterUrl, isInPlaylist, togglePlaylistVideo } = useVideoGalleryTile(
  () => props.item,
);
</script>

<template>
  <li v-if="item.videoUrl" class="video-gallery__item">
    <!-- The card is a plain div (not a figure) so it never nests the media
         figure inside another figure; padding: 0 overrides the global
         .exchange-message div padding so the media stays flush. -->
    <div class="video-gallery__card">
      <!-- Caption overlay anchored to the top edge, so the video fills the
           whole card. The title + actions row stays adjacent to the edge,
           keeping the add-to-playlist toggle pinned to the top corner. -->
      <MediaCaptionScrim edge="top">
        <MediaCardHeader :title="item.title" :url="item.videoUrl" tooltip flush>
          <template #actions>
            <!-- Info toggle: only shown when the video carries a description;
                 the caption itself is visible in the row below. -->
            <IconButton
              v-if="item.description"
              :title="item.title ?? ''"
              :aria-label="$t('common.moreInfo')"
              size="lg"
            >
              <Info class="video-gallery__info-icon" />
              <template #tooltip-content>
                <div class="video-gallery__tooltip">
                  <span class="video-gallery__tooltip-desc">{{
                    item.description
                  }}</span>
                </div>
              </template>
            </IconButton>

            <PlaylistToggleButton
              :active="isInPlaylist"
              @toggle="togglePlaylistVideo"
            />
          </template>
        </MediaCardHeader>
        <p v-if="item.caption" class="video-gallery__caption-text">
          {{ item.caption }}
        </p>
      </MediaCaptionScrim>

      <!-- The media sits flush inside the card, exactly like the video list:
           no wrapper box, so nothing fights the floating popup. The
           video-gallery__video class lands on the figure's root element and
           carries the layout constraints below. -->
      <FloatingVideoFigure
        class="video-gallery__video"
        :video-url="item.videoUrl"
        :title="item.title"
        :poster-url="posterUrl"
      />
    </div>
  </li>
</template>

<style scoped>
.video-gallery__item .video-gallery__card {
  position: relative;
  margin: 0 auto;
  /* Beat the global .exchange-message div padding so the media stays flush. */
  padding: 0;
  border: 1px solid var(--color-divider);
  overflow: hidden;
  background: var(--color-bg-tertiary);
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 240px;
  width: 100%;
}

/* ---------- rich tooltip content (description + caption) ----------
   The panel is teleported to <body>; the slot elements keep this component's
   scope id, so these scoped rules still apply. */

.video-gallery__tooltip {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.video-gallery__tooltip-desc {
  font-weight: 500;
  color: var(--color-fg-secondary);
}

/* Second row of the top caption overlay: the caption line under the header,
   mirroring the carousel's caption text. */
.video-gallery__caption-text {
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-fg-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.video-gallery__info-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

/* Single-item gallery: constrain the player box and center it. */
:global(.video-gallery--count-1 > li) .video-gallery__card {
  flex: 0 0 auto;
  min-height: 0;
  height: 100%;
  width: 70%;
  align-items: center;
  justify-content: center;
}

:global(.video-gallery--count-1 > li) .video-gallery__video {
  flex: 0 0 auto;
  min-height: 0;
  width: 100%;
  aspect-ratio: 16 / 9;
  height: auto;
  max-height: 100%;
}

/* Layout constraints for the FloatingVideoFigure root (class fallthrough).
   No background of its own — the media box inside owns the backdrop, so the
   card never reads as a card in a card. */
.video-gallery__item .video-gallery__video {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  min-height: 180px;
  flex: 1 1 auto;
}
</style>
